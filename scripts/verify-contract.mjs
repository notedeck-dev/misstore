#!/usr/bin/env node

// 契約テスト: ストア配布物 (plugins / widgets / skills) を NoteDeck の契約スナップショット
// (scripts/contract/notedeck-contract.json) と機械照合する。docs/design/contract-check.md。
//
// 使い方: node scripts/verify-contract.mjs [--json] [--strict] [--contract <path>]
//   error (パース失敗 / 契約違反 issues) があれば exit 1。
//   --strict  : unresolved (第 1 引数がリテラルでない Nd:call / Mk:api / Nd:on) も error にする
//   --json    : 機械可読な JSON を stdout に出す (contract-drift ワークフローが使う)
//   --contract: 既定以外のスナップショットで照合する

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parser } from '@syuilo/aiscript'
import { deriveContract, loadContract, CONTRACT_PATH } from './lib/derive-contract.mjs'

const REGISTRY_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'registry')

const KINDS = {
  plugins: 'plugin.is',
  widgets: 'widget.is',
  skills: 'skill.md',
}

const args = process.argv.slice(2)
const JSON_OUT = args.includes('--json')
const STRICT = args.includes('--strict')
const contractArg = args.indexOf('--contract')
const contractPath = contractArg >= 0 ? resolve(args[contractArg + 1]) : CONTRACT_PATH
const contract = loadContract(contractPath)
const KNOWN_GAPS_PATH = join(dirname(fileURLToPath(import.meta.url)), 'contract', 'known-gaps.json')
const KNOWN_GAPS = existsSync(KNOWN_GAPS_PATH) ? JSON.parse(readFileSync(KNOWN_GAPS_PATH, 'utf-8')) : {}

function scanDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

const items = []
const errors = []
const warnings = []

for (const [kind, sourceName] of Object.entries(KINDS)) {
  for (const id of scanDirs(join(REGISTRY_DIR, kind))) {
    const label = `${kind}/${id}`
    const sourcePath = join(REGISTRY_DIR, kind, id, sourceName)
    if (!existsSync(sourcePath)) continue // 主ソース欠落は check-registry-integrity.mjs の領分
    const source = readFileSync(sourcePath, 'utf-8')

    let meta = {}
    const metaPath = join(REGISTRY_DIR, kind, id, 'meta.json')
    if (kind !== 'skills' && existsSync(metaPath)) {
      try {
        meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
      } catch {
        // 不正な meta.json は check-registry-integrity.mjs が弾く。ここでは宣言なし扱い
      }
    }

    // NoteDeck と同じ @syuilo/aiscript でパースできないソースはインストールもできない
    if (kind !== 'skills') {
      try {
        Parser.parse(source)
      } catch (e) {
        errors.push(`[${label}] AiScript パース失敗: ${e?.message ?? e}`)
      }
    }

    const derived = deriveContract(kind, source, meta, contract)
    items.push({ kind, id, ...derived })

    for (const issue of derived.issues) {
      // notedeck 側の既知の欠落 (scripts/contract/known-gaps.json) は warning に降格する
      const gap = issue.match(/^Mk:api "([^"]+)" は endpoint 対応表に無い/)
      const known = gap && KNOWN_GAPS.endpoints?.[gap[1]]
      if (known) warnings.push(`[${label}] ${issue} — 既知: ${known.issue}`)
      else errors.push(`[${label}] ${issue}`)
    }
    for (const u of derived.unresolved) {
      const msg = `[${label}] 第 1 引数がリテラルでない呼び出し (${u}) — 宛先を静的に導出できない (最悪ケース = 任意宛先)`
      if (STRICT) errors.push(msg)
      else warnings.push(msg)
    }
    if (Array.isArray(meta.permissions) && meta.permissions.some((p) => String(p).includes(':'))) {
      warnings.push(
        `[${label}] meta.permissions が Misskey scope 形式 (${meta.permissions.join(', ')}) — NoteDeck の permission key と照合できない。導出値: ${derived.permissions.join(', ') || '(なし)'}`,
      )
    }
  }
}

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        contract: { path: contractPath, ref: contract.source?.ref, generatedAt: contract.generatedAt },
        strict: STRICT,
        counts: { items: items.length, errors: errors.length, warnings: warnings.length },
        errors,
        warnings,
        items,
      },
      null,
      2,
    ),
  )
} else {
  for (const w of warnings) console.warn(`WARN  ${w}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  const byKind = Object.keys(KINDS)
    .map((k) => `${k} ${items.filter((i) => i.kind === k).length}`)
    .join(' / ')
  const failing = new Set(errors.map((e) => e.match(/^\[([^\]]+)\]/)?.[1]))
  console.log(
    `\n契約チェック: ${items.length} 件 (${byKind}) を ref=${(contract.source?.ref ?? '?').slice(0, 12)} と照合 — ` +
      `合格 ${items.length - failing.size} / 不合格 ${failing.size}、警告 ${warnings.length} 件、エラー ${errors.length} 件`,
  )
}

if (errors.length > 0) {
  if (!JSON_OUT) console.error('詳細は docs/design/contract-check.md を参照。')
  process.exit(1)
}
