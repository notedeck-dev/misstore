#!/usr/bin/env node

// レジストリ完全性チェック(CI 骨組み)。
// docs/design/security.md の S9/S11/S12 のうち、赤チーム検証で「アーキテクチャに
// 依存せず生き残った」高価値チェックを実装する。ここは「機械的に確実に弾ける」ものだけ。
// 権限の静的導出(S10)やロジックボム検出は human review の領域で、ここには含めない。
//
// 使い方: node scripts/check-registry-integrity.mjs
//   問題があれば一覧を出力し exit 1。警告のみなら exit 0。

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REGISTRY_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'registry')

// 種別 → 主ソースファイル名(skills は meta.json を持たず skill.md の frontmatter)
const KINDS = {
  plugins: 'plugin.is',
  themes: 'theme.json5',
  widgets: 'widget.is',
  queries: 'query.is',
  skills: 'skill.md',
}

const MAX_SOURCE_BYTES = 500 * 1024 // S2: サイズ上限 500KB

const errors = []
const warnings = []

// S9: 見た目とパーサ解釈を乖離させる不可視/制御文字。
// bidi 制御は無条件 reject(Trojan Source, CVE-2021-42574)。
const BIDI_CONTROLS = /[‪-‮⁦-⁩]/
// ゼロ幅・不可視。U+200D(ZWJ)と U+FE0F(VS16)は絵文字で正当に使われるので警告に留め、
// 明確に危険なものだけ hard-fail する(R2-17: 一律 reject は日本語圏の name を壊す)。
const ZERO_WIDTH_HARD = /[​‌⁠﻿]/ // ZWSP, ZWNJ, WordJoiner, BOM(先頭以外)
const ZWJ = /‍/

function scanDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

function checkText(label, text) {
  if (BIDI_CONTROLS.test(text)) {
    errors.push(`[${label}] Unicode 双方向制御文字を含む(Trojan Source)`)
  }
  // BOM は先頭のみ許容せず一律 reject(正規形は UTF-8 no-BOM)
  if (text.charCodeAt(0) === 0xfeff || ZERO_WIDTH_HARD.test(text)) {
    errors.push(`[${label}] ゼロ幅/不可視文字(ZWSP/ZWNJ/WordJoiner/BOM)を含む`)
  }
  if (text.includes('\r')) {
    errors.push(`[${label}] CRLF/CR を含む(正規形は LF)`)
  }
  if (ZWJ.test(text)) {
    // TODO: UTS #51 RGI 絵文字シーケンスとして妥当な ZWJ のみ許可する厳密判定
    warnings.push(`[${label}] ZWJ(U+200D)を含む — 絵文字なら可、それ以外は要確認`)
  }
}

// S12: SVG に実行能力を持たせる要素/属性を reject
function checkSvg(label, svg) {
  const patterns = [
    [/<script[\s>]/i, '<script>'],
    [/<foreignObject[\s>]/i, '<foreignObject>'],
    [/\son\w+\s*=/i, 'on* イベントハンドラ属性'],
    [/(href|xlink:href)\s*=\s*["']?\s*(https?:|data:)/i, '外部/data: href'],
  ]
  for (const [re, name] of patterns) {
    if (re.test(svg)) errors.push(`[${label}] icon.svg に ${name} を含む`)
  }
}

for (const [kind, sourceName] of Object.entries(KINDS)) {
  const kindDir = join(REGISTRY_DIR, kind)
  for (const id of scanDirs(kindDir)) {
    const itemDir = join(kindDir, id)
    const label = `${kind}/${id}`

    // 主ソース
    const sourcePath = join(itemDir, sourceName)
    if (!existsSync(sourcePath)) {
      errors.push(`[${label}] 主ソース ${sourceName} が無い`)
    } else {
      const src = readFileSync(sourcePath, 'utf-8')
      checkText(`${label}/${sourceName}`, src)
      const bytes = statSync(sourcePath).size
      if (bytes > MAX_SOURCE_BYTES) {
        errors.push(`[${label}] 主ソースが ${MAX_SOURCE_BYTES} バイトを超える(${bytes})`)
      }
    }

    // meta.json(skills は持たない)
    const metaPath = join(itemDir, 'meta.json')
    if (kind !== 'skills') {
      if (!existsSync(metaPath)) {
        errors.push(`[${label}] meta.json が無い`)
      } else {
        const metaRaw = readFileSync(metaPath, 'utf-8')
        checkText(`${label}/meta.json`, metaRaw)
        // S11 / R2-3: meta.id はディレクトリ名と一致必須(アイテム乗っ取り防止)
        let meta
        try {
          meta = JSON.parse(metaRaw)
        } catch {
          errors.push(`[${label}] meta.json が不正な JSON`)
          meta = {}
        }
        if (meta.id && meta.id !== id) {
          errors.push(`[${label}] meta.id (${meta.id}) がディレクトリ名 (${id}) と不一致 — アイテム乗っ取りの温床`)
        }
        // S4 / R2-2: 日付は git 由来のみ。自己申告を禁止
        if (meta.createdAt || meta.updatedAt) {
          errors.push(`[${label}] meta.json に createdAt/updatedAt を書かない(日付は git 由来)`)
        }
      }
    }

    // icon.svg(任意)
    const iconPath = join(itemDir, 'icon.svg')
    if (existsSync(iconPath)) {
      const svg = readFileSync(iconPath, 'utf-8')
      checkText(`${label}/icon.svg`, svg)
      checkSvg(label, svg)
    }
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`)
for (const e of errors) console.error(`ERROR ${e}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} 件のエラー。詳細は docs/design/security.md の S9/S11/S12 を参照。`)
  process.exit(1)
}
console.log(`レジストリ完全性チェック OK(警告 ${warnings.length} 件)`)
