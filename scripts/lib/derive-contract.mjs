// ストア配布物 (plugin.is / widget.is / skill.md) から NoteDeck 契約 (capability / endpoint /
// event / hook / 権限) を静的に導出する (docs/design/security.md S10、docs/design/contract-check.md)。
//
// build-registry.js と verify-contract.mjs の両方から import される。副作用なし。
//
//   import { deriveContract } from './lib/derive-contract.mjs'
//   const d = deriveContract('plugins', source, meta)          // kind は 'plugins' | 'widgets' | 'skills'
//   d.issues.length === 0 なら契約に適合
//
// 基準となる契約は scripts/contract/notedeck-contract.json (pnpm contract:sync で再生成)。
// 第 4 引数で別のスナップショットを渡せる (contract-drift ワークフローが使う)。

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from '@syuilo/aiscript'

export const CONTRACT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'contract',
  'notedeck-contract.json',
)

export function loadContract(path = CONTRACT_PATH) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

let defaultContract = null

const HOST_FUNCTIONS = {
  ND_CALL: 'Nd:call',
  MK_API: 'Mk:api',
  ND_HTTP: 'Nd:http',
  ND_ON: 'Nd:on',
  ND_REGISTER_COMMAND: 'Nd:register_command',
}
// 呼び出し構文以外 (束縛 / 引数渡し / 格納) で現れてはならないホスト関数 (S10 / R1-H)
const VALUE_REF_FORBIDDEN = new Set([HOST_FUNCTIONS.ND_CALL, HOST_FUNCTIONS.MK_API, HOST_FUNCTIONS.ND_HTTP])
// 外部ネットワークに出る capability (宛先は引数なので静的には任意宛先)。必要 permission は
// 各 capability の宣言 (http.fetch → network.external、vault.fetch → vault.use) から取るので
// ここでは external フラグだけ立てる。Nd:http は capability でないので network.external を直接足す
const EXTERNAL_CAPABILITIES = new Set(['http.fetch', 'vault.fetch'])
// capability の名前空間 + 動詞の形をしているが capability ではない、NoteDeck の既知 id。
// skill 本文の「改名・削除の疑い」検査から除く (ai.heartbeat = HEARTBEAT の principal id)
const KNOWN_NON_CAPABILITY_TOKENS = new Set(['ai.heartbeat'])
const PRESET_ORDER = ['readonly', 'safe', 'full']

function normalizeKind(kind) {
  const k = String(kind).replace(/s$/, '')
  if (k !== 'plugin' && k !== 'widget' && k !== 'skill') {
    throw new Error(`deriveContract: 未対応の kind "${kind}" (plugins / widgets / skills のみ)`)
  }
  return k
}

function sortedUnique(iterable) {
  return [...new Set(iterable)].sort()
}

// --- AiScript (plugin.is / widget.is) ---------------------------------------

function isNode(x) {
  return x !== null && typeof x === 'object' && typeof x.type === 'string'
}

// 文字列リテラル / 全パートが文字列のテンプレートなら値を返す。それ以外 (識別子・式) は null
function literalString(node) {
  if (!node) return null
  if (node.type === 'str') return node.value
  if (node.type === 'tmpl' && node.tmpl.every((p) => p.type === 'str')) {
    return node.tmpl.map((p) => p.value).join('')
  }
  return null
}

function emptyAnalysis() {
  return {
    ndCalls: new Set(),
    mkApi: new Set(),
    hooks: new Set(),
    ndFunctions: new Set(), // 参照された Nd:* / NOTEDECK 名 (未知の Nd:* を検出する)
    external: false,
    ndHttp: false, // Nd:http の直接呼び出し (network.external を要求)
    unresolved: [],
    usesNotedeck: false,
    valueRefs: [], // ホスト関数を値として参照した箇所 ("Nd:call@L12")
    parseError: null,
  }
}

function noteIdentifier(a, name) {
  if (name.startsWith('Nd:') || name.startsWith('Ui:') || name === 'NOTEDECK') {
    a.usesNotedeck = true
    if (!name.startsWith('Ui:')) a.ndFunctions.add(name)
  }
}

function analyzeAst(nodes) {
  const a = emptyAnalysis()
  const loc = (n) => `L${n.loc?.start?.line ?? '?'}`

  const handleCall = (node) => {
    const name = node.target.name
    const arg0 = node.args[0]
    const lit = literalString(arg0)
    switch (name) {
      case HOST_FUNCTIONS.ND_CALL:
        if (lit !== null) {
          a.ndCalls.add(lit)
          if (EXTERNAL_CAPABILITIES.has(lit)) a.external = true
        } else a.unresolved.push(`${name}@${loc(node)}`)
        break
      case HOST_FUNCTIONS.MK_API:
        if (lit !== null) a.mkApi.add(lit)
        else a.unresolved.push(`${name}@${loc(node)}`)
        break
      case HOST_FUNCTIONS.ND_HTTP:
        a.external = true
        a.ndHttp = true
        break
      case HOST_FUNCTIONS.ND_ON:
        if (lit !== null) a.hooks.add(`on:${lit}`)
        else a.unresolved.push(`${name}@${loc(node)}`)
        break
      case HOST_FUNCTIONS.ND_REGISTER_COMMAND:
        a.hooks.add('command')
        break
      default: {
        const m = name.match(/^Plugin:register_([a-z_]+)$/)
        if (m) a.hooks.add(m[1])
      }
    }
  }

  const walk = (x) => {
    if (Array.isArray(x)) {
      for (const el of x) walk(el)
      return
    }
    if (x instanceof Map) {
      for (const v of x.values()) walk(v)
      return
    }
    if (x === null || typeof x !== 'object') return
    if (isNode(x)) {
      if (x.type === 'identifier') {
        noteIdentifier(a, x.name)
        if (VALUE_REF_FORBIDDEN.has(x.name)) a.valueRefs.push(`${x.name}@${loc(x)}`)
        return
      }
      if (x.type === 'call' && x.target?.type === 'identifier') {
        noteIdentifier(a, x.target.name)
        handleCall(x)
        walk(x.args)
        return
      }
      if (x.type === 'exists') {
        // `exists NOTEDECK` は機能検出。参照として数える (NoteDeck 向けに書かれた印)
        noteIdentifier(a, x.identifier.name)
        return
      }
    }
    for (const [k, v] of Object.entries(x)) {
      if (k === 'loc' || k === 'type') continue
      walk(v)
    }
  }
  walk(nodes)
  return a
}

// 文字列リテラル (" ' `) を保ったままコメント (// と /* */) を落とす。正規表現フォールバック専用
export function stripComments(src) {
  let out = ''
  let i = 0
  let quote = null
  while (i < src.length) {
    const c = src[i]
    const next = src[i + 1]
    if (quote) {
      out += c
      if (c === '\\' && i + 1 < src.length) {
        out += next
        i += 2
        continue
      }
      if (c === quote) quote = null
      i++
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      out += c
      i++
      continue
    }
    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2)
      const skipped = end < 0 ? src.slice(i) : src.slice(i, end + 2)
      out += skipped.replace(/[^\n]/g, '') // 行番号を保つ
      i = end < 0 ? src.length : end + 2
      continue
    }
    out += c
    i++
  }
  return out
}

function analyzeByRegex(src) {
  const a = emptyAnalysis()
  const text = stripComments(src)
  const lines = text.split('\n')
  lines.forEach((line, idx) => {
    const L = `L${idx + 1}`
    for (const m of line.matchAll(/\b(Nd:call|Mk:api|Nd:on)\(\s*(?:"([^"]*)"|'([^']*)'|`([^`{]*)`|([^"'`\s)]))/g)) {
      const [, fn, dq, sq, bq, other] = m
      const lit = dq ?? sq ?? bq ?? null
      if (other !== undefined || lit === null) {
        a.unresolved.push(`${fn}@${L}`)
        continue
      }
      if (fn === 'Nd:call') {
        a.ndCalls.add(lit)
        if (EXTERNAL_CAPABILITIES.has(lit)) a.external = true
      } else if (fn === 'Mk:api') a.mkApi.add(lit)
      else a.hooks.add(`on:${lit}`)
    }
    for (const m of line.matchAll(/\bPlugin:register_([a-z_]+)\(/g)) a.hooks.add(m[1])
    if (/\bNd:register_command\(/.test(line)) a.hooks.add('command')
    if (/\bNd:http\(/.test(line)) {
      a.external = true
      a.ndHttp = true
    }
    for (const m of line.matchAll(/(?<![\w:])(Nd:[A-Za-z_]+|Ui:[A-Za-z_:]+|NOTEDECK)\b/g)) {
      noteIdentifier(a, m[1])
      // 直後が "(" でない Nd:call / Mk:api / Nd:http は値参照
      if (VALUE_REF_FORBIDDEN.has(m[1]) && line[m.index + m[0].length] !== '(') a.valueRefs.push(`${m[1]}@${L}`)
    }
    for (const m of line.matchAll(/(?<![\w:])Mk:api\b/g)) {
      if (line[m.index + m[0].length] !== '(') a.valueRefs.push(`Mk:api@${L}`)
    }
  })
  return a
}

// AiScript ソースを解析する。Parser が失敗したら正規表現で近似し parseError を立てる
export function analyzeAiScript(source) {
  try {
    return analyzeAst(Parser.parse(source))
  } catch (e) {
    const a = analyzeByRegex(source)
    a.parseError = e?.message ?? String(e)
    return a
  }
}

// --- skill.md ----------------------------------------------------------------

// build-registry.js の parseFrontmatter と同じフラット YAML サブセット + ブロックリスト (- item)
export function parseSkillFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: text }
  const meta = {}
  let listKey = null
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line || /^\s*#/.test(line)) continue
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && listKey) {
      meta[listKey].push(parseScalar(item[1]))
      continue
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    const [, key, raw] = kv
    if (raw.trim() === '') {
      meta[key] = []
      listKey = key
    } else {
      meta[key] = parseScalar(raw)
      listKey = null
    }
  }
  return { meta, body: m[2] }
}

function parseScalar(raw) {
  const v = raw.trim()
  if (v === '' || v === '~' || v === 'null') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (/^\[.*\]$/.test(v)) {
    const inner = v.slice(1, -1).trim()
    return inner ? inner.split(',').map((s) => parseScalar(s)) : []
  }
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1)
  return v
}

// 本文のバッククォート内に現れる `xxx.yyy` トークンを集める。
// 既知 capability → ndCalls。未知だが「capability の名前空間 (単複のゆれ込み) + capability の動詞」の形
// (例: 改名前の `theme.list`) → 疑い。`note.text` (フィールド参照) や `meta.json` (ファイル名) は動詞でないので除く
function collectSkillTokens(body, contract) {
  const ids = Object.keys(contract.capabilities)
  const namespaces = new Set(ids.map((id) => id.split('.')[0]))
  const verbs = new Set(ids.map((id) => id.split('.').at(-1)))
  const namespaceLike = (ns) =>
    namespaces.has(ns) || namespaces.has(`${ns}s`) || (ns.endsWith('s') && namespaces.has(ns.slice(0, -1)))
  const known = new Set()
  const suspicious = new Set()
  for (const m of body.matchAll(/`([^`\n]+)`/g)) {
    for (const t of m[1].matchAll(/(?<![\w./:-])([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)(?![\w/-])/g)) {
      const token = t[1]
      if (contract.capabilities[token]) {
        known.add(token)
        continue
      }
      if (contract.permissionPresets[token] || KNOWN_NON_CAPABILITY_TOKENS.has(token)) continue
      const parts = token.split('.')
      if (namespaceLike(parts[0]) && verbs.has(parts.at(-1))) suspicious.add(token)
    }
  }
  return { known, suspicious }
}

// --- 権限 / プロファイル -------------------------------------------------------

// 必要 permission key 集合から最小 preset を決める。presets に無いキー (= full のみ) があれば full
export function computeProfile(keys, permissionPresets) {
  for (const preset of PRESET_ORDER) {
    if (preset === 'full') return 'full'
    if ([...keys].every((k) => (permissionPresets[k] ?? []).includes(preset))) return preset
  }
  return 'full'
}

// --- 公開 API -------------------------------------------------------------------

/**
 * @param {'plugins'|'widgets'|'skills'|'plugin'|'widget'|'skill'} kind
 * @param {string} source  plugin.is / widget.is / skill.md の全文
 * @param {object} [meta]  meta.json (plugins / widgets)。skills は frontmatter を source から読むので省略可
 * @param {object} [contract]  契約スナップショット (既定: scripts/contract/notedeck-contract.json)
 */
export function deriveContract(kind, source, meta = {}, contract = (defaultContract ??= loadContract())) {
  const k = normalizeKind(kind)
  const issues = []
  const requiredKeys = new Set()
  let analysis
  let declared = meta?.permissions

  if (k === 'skill') {
    const { meta: fm, body } = parseSkillFrontmatter(source)
    const { known, suspicious } = collectSkillTokens(body, contract)
    analysis = emptyAnalysis()
    analysis.ndCalls = known
    analysis.usesNotedeck = true
    for (const t of [...suspicious].sort()) {
      issues.push(`本文の \`${t}\` は capability の名前空間を名乗るが NoteDeck に無い (改名・削除の疑い)`)
    }
    const cheap = Array.isArray(fm.cheapCheckCapabilities) ? fm.cheapCheckCapabilities : []
    for (const id of cheap) {
      const cap = contract.capabilities[id]
      if (!cap) issues.push(`cheapCheckCapabilities の "${id}" は未知の capability`)
      else if (cap.exec !== 'core' || !cap.cheap) {
        issues.push(
          `cheapCheckCapabilities の "${id}" は exec:${cap.exec} / cheap:${cap.cheap} — exec:core かつ cheap でないと heartbeat 登録が拒否される`,
        )
      }
    }
    if (declared === undefined && Array.isArray(fm.permissions)) declared = fm.permissions
  } else {
    analysis = analyzeAiScript(source)
    for (const ref of analysis.valueRefs) {
      issues.push(`ホスト関数を値として参照している (${ref}) — 呼び出し構文 fn("literal", …) でのみ使う`)
    }
    if (Array.isArray(contract.ndFunctions)) {
      for (const name of [...analysis.ndFunctions].sort()) {
        if (!contract.ndFunctions.includes(name)) issues.push(`未知の NoteDeck ホスト関数 ${name}`)
      }
    }
  }

  // capability → permissions
  for (const id of [...analysis.ndCalls].sort()) {
    const cap = contract.capabilities[id]
    if (!cap) {
      issues.push(`未知の capability "${id}"`)
      continue
    }
    for (const p of cap.permissions) requiredKeys.add(p)
  }
  // Mk:api endpoint → rule
  for (const ep of [...analysis.mkApi].sort()) {
    const rule = contract.endpoints[ep]
    if (rule === undefined) issues.push(`Mk:api "${ep}" は endpoint 対応表に無い (deny-by-default)`)
    else if (rule === 'allow') continue
    else if (rule.startsWith('deny:')) issues.push(`Mk:api "${ep}" は NoteDeck が恒久拒否 (${rule.slice(5)})`)
    else requiredKeys.add(rule)
  }
  if (analysis.ndHttp) requiredKeys.add('network.external')

  // hook / event
  for (const h of [...analysis.hooks].sort()) {
    if (h === 'command') continue
    if (h.startsWith('on:')) {
      if (!contract.events.includes(h.slice(3))) issues.push(`Nd:on の未知イベント "${h.slice(3)}"`)
    } else if (!contract.hooks.includes(h)) issues.push(`未知のフック Plugin:register_${h}`)
  }

  // 宣言 permissions との突合 (NoteDeck permission key で宣言されている場合のみ)
  if (Array.isArray(declared) && declared.length > 0) {
    const legacy = declared.some((p) => typeof p !== 'string' || p.includes(':'))
    if (!legacy) {
      for (const p of declared) {
        if (!contract.permissionPresets[p]) issues.push(`宣言 permissions の "${p}" は未知の permission key`)
      }
      for (const p of [...requiredKeys].sort()) {
        if (!declared.includes(p)) issues.push(`導出された permission "${p}" が宣言 permissions に無い`)
      }
    }
  }

  const resolvedAny = analysis.ndCalls.size > 0 || analysis.mkApi.size > 0 || analysis.external
  let profile
  if (!resolvedAny && analysis.unresolved.length > 0) profile = null
  else profile = computeProfile(requiredKeys, contract.permissionPresets)

  const runsOn = k === 'plugin' && !analysis.usesNotedeck ? ['notedeck', 'misskey-web'] : ['notedeck']

  return {
    runsOn,
    profile,
    permissions: sortedUnique(requiredKeys),
    ndCalls: sortedUnique(analysis.ndCalls),
    mkApi: sortedUnique(analysis.mkApi),
    hooks: sortedUnique(analysis.hooks),
    external: analysis.external,
    unresolved: [...analysis.unresolved],
    issues,
    ...(analysis.parseError ? { parseError: analysis.parseError } : {}),
  }
}
