#!/usr/bin/env node

// NoteDeck の正本から「契約スナップショット」scripts/contract/notedeck-contract.json を生成する。
// ストアの配布物 (plugin.is / widget.is / skill.md) が参照する capability id・Misskey endpoint・
// Nd:on イベント名・Plugin:register_* フックを、NoteDeck 側の定義と機械照合するための基準。
// 設計は docs/design/contract-check.md。
//
// 使い方:
//   NOTEDECK_DIR=/path/to/notedeck node scripts/sync-notedeck-contract.mjs   # ローカル checkout から
//   node scripts/sync-notedeck-contract.mjs                                   # GitHub raw (main) から
//   オプション: --out <path> (既定 scripts/contract/notedeck-contract.json)、--ref <git ref> (raw 取得時)

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSON5 from 'json5'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT = resolve(__dirname, 'contract', 'notedeck-contract.json')
const REPO = 'notedeck-dev/notedeck'

const FILES = {
  capabilities: 'crates/notecore/capabilities.json5',
  endpoints: 'src/permissions/misskeyEndpoints.generated.ts',
  events: 'src/aiscript/events.ts',
  pluginApi: 'src/aiscript/plugin-api.ts',
  notedeckApi: 'src/aiscript/notedeck-api.ts',
}

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

// --- 取得 ---------------------------------------------------------------

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'misstore-contract-sync' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.text()
}

async function loadSources() {
  const localDir = process.env.NOTEDECK_DIR
  if (localDir) {
    let ref = 'local'
    try {
      ref = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: localDir, encoding: 'utf-8' }).trim()
    } catch {
      // git が無い / checkout でない場合は 'local' のまま
    }
    const texts = Object.fromEntries(
      Object.entries(FILES).map(([k, rel]) => [k, readFileSync(join(localDir, rel), 'utf-8')]),
    )
    return { texts, ref, origin: `local:${localDir}` }
  }

  const wanted = argValue('--ref') ?? 'main'
  // 取得したコミットを固定するため、先に ref → sha を解決する (API が使えなければ ref のまま)
  let ref = wanted
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${wanted}`, {
      headers: { Accept: 'application/vnd.github.sha', 'User-Agent': 'misstore-contract-sync' },
    })
    if (res.ok) ref = (await res.text()).trim()
  } catch {
    // rate limit 等。ref 名で取得する
  }
  const texts = {}
  for (const [k, rel] of Object.entries(FILES)) {
    texts[k] = await fetchText(`https://raw.githubusercontent.com/${REPO}/${ref}/${rel}`)
  }
  return { texts, ref, origin: `github:${REPO}` }
}

// --- 抽出 ---------------------------------------------------------------

function sortObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}

// capabilities.json5 → capabilities / permissionPresets。
// ファイル内の '${accountIdParamDesc}' 等はただの文字列なので JSON5 としてはそのまま読めるが、
// 将来テンプレート展開が構文側に移っても壊れないよう、先に無害な文字列へ潰しておく。
function parseCapabilities(text) {
  const sanitized = text.replace(/\$\{[a-zA-Z]+\}/g, (m) => m.slice(2, -1))
  let doc
  try {
    doc = JSON5.parse(sanitized)
  } catch (e) {
    console.warn(`WARN  capabilities.json5 を JSON5 として読めない (${e.message})。正規表現で抽出する`)
    return parseCapabilitiesFallback(text)
  }
  const capabilities = {}
  for (const [id, def] of Object.entries(doc.capabilities ?? {})) {
    capabilities[id] = {
      permissions: Array.isArray(def.permissions) ? [...def.permissions] : [],
      exec: def.exec === 'device' ? 'device' : 'core',
      cheap: def.cheap === true,
      confirm: def.confirm === true,
      untrusted: def.untrusted === true,
    }
  }
  const permissionPresets = {}
  for (const [key, def] of Object.entries(doc.permissions ?? {})) {
    permissionPresets[key] = Array.isArray(def.presets) ? [...def.presets] : []
  }
  return { capabilities: sortObject(capabilities), permissionPresets: sortObject(permissionPresets) }
}

// JSON5 が読めないときの保険。トップレベル 2 段目のキー ('xxx.yyy': {) をブロック境界として
// permissions 配列と exec / cheap / confirm / untrusted のスカラーだけ拾う。
function parseCapabilitiesFallback(text) {
  const capabilities = {}
  const permissionPresets = {}
  const capStart = text.indexOf('\n  capabilities: {')
  const permStart = text.indexOf('\n  permissions: {')
  const permBlock = text.slice(permStart, capStart > permStart ? capStart : undefined)
  for (const m of permBlock.matchAll(/^\s{4}'([^']+)':\s*\{([^}]*)\}/gm)) {
    permissionPresets[m[1]] = [...m[2].matchAll(/'(readonly|safe)'/g)].map((x) => x[1])
  }
  const capBlock = text.slice(capStart)
  const blocks = capBlock.split(/^\s{4}'([a-zA-Z][\w.]*)':\s*\{\s*$/m)
  for (let i = 1; i < blocks.length; i += 2) {
    const id = blocks[i]
    const body = blocks[i + 1] ?? ''
    const permM = body.match(/^\s{6}permissions:\s*\[([\s\S]*?)\]/m)
    capabilities[id] = {
      permissions: permM ? [...permM[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [],
      exec: /^\s{6}exec:\s*'device'/m.test(body) ? 'device' : 'core',
      cheap: /^\s{6}cheap:\s*true/m.test(body),
      confirm: /^\s{6}confirm:\s*true/m.test(body),
      untrusted: /^\s{6}untrusted:\s*true/m.test(body),
    }
  }
  return { capabilities: sortObject(capabilities), permissionPresets: sortObject(permissionPresets) }
}

// MISSKEY_ENDPOINT_RULES の object literal → { endpoint: rule }
function parseEndpoints(text) {
  const start = text.indexOf('MISSKEY_ENDPOINT_RULES')
  if (start < 0) throw new Error('misskeyEndpoints.generated.ts に MISSKEY_ENDPOINT_RULES が無い')
  const body = text.slice(text.indexOf('{', start), text.indexOf('\n}', start))
  const endpoints = {}
  for (const m of body.matchAll(/^\s*'([^']+)':\s*'([^']+)',?\s*$/gm)) {
    endpoints[m[1]] = m[2]
  }
  return sortObject(endpoints)
}

// SUPPORTED_EVENT_NAMES の配列リテラル → イベント名一覧
function parseEvents(text) {
  const start = text.indexOf('SUPPORTED_EVENT_NAMES')
  if (start < 0) throw new Error('events.ts に SUPPORTED_EVENT_NAMES が無い')
  // 型注釈 `readonly NoteDeckEventName[]` の [] を飛ばし、代入右辺の配列リテラルを取る
  const open = text.indexOf('= [', start) + 2
  const body = text.slice(open, text.indexOf(']', open))
  return [...new Set([...body.matchAll(/'([a-z]+:[a-z]+)'/g)].map((m) => m[1]))].sort()
}

// consts['Plugin:register_xxx'] → 'xxx'
function parseHooks(text) {
  return [...new Set([...text.matchAll(/consts\['Plugin:register_([a-z_]+)'\]/g)].map((m) => m[1]))].sort()
}

// consts['Nd:xxx'] / consts.NOTEDECK → NoteDeck が AiScript に注入する名前
function parseNdFunctions(text) {
  const names = new Set([...text.matchAll(/consts\['(Nd:[a-zA-Z_]+)'\]/g)].map((m) => m[1]))
  if (/consts\.NOTEDECK\s*=/.test(text)) names.add('NOTEDECK')
  return [...names].sort()
}

// --- main ---------------------------------------------------------------

const { texts, ref, origin } = await loadSources()
const { capabilities, permissionPresets } = parseCapabilities(texts.capabilities)
const contract = {
  generatedAt: new Date().toISOString(),
  source: { repo: REPO, ref, origin, files: Object.values(FILES) },
  capabilities,
  permissionPresets,
  endpoints: parseEndpoints(texts.endpoints),
  events: parseEvents(texts.events),
  hooks: parseHooks(texts.pluginApi),
  ndFunctions: parseNdFunctions(texts.notedeckApi),
}

const counts = {
  capabilities: Object.keys(contract.capabilities).length,
  permissionPresets: Object.keys(contract.permissionPresets).length,
  endpoints: Object.keys(contract.endpoints).length,
  events: contract.events.length,
  hooks: contract.hooks.length,
  ndFunctions: contract.ndFunctions.length,
}
for (const [k, n] of Object.entries(counts)) {
  if (n === 0) {
    console.error(`ERROR ${k} が 0 件 — 正本の形式が変わった可能性。抽出ロジックを見直す`)
    process.exit(1)
  }
}

const out = argValue('--out') ?? DEFAULT_OUT
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(contract, null, 2) + '\n')
console.log(
  `契約スナップショットを書き出した: ${out}\n` +
    `  ref=${ref} (${origin})\n` +
    `  capabilities=${counts.capabilities} permissionPresets=${counts.permissionPresets} ` +
    `endpoints=${counts.endpoints} events=${counts.events} hooks=${counts.hooks} ndFunctions=${counts.ndFunctions}`,
)
