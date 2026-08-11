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
import JSON5 from 'json5'

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

// notedeck#913: storeId(ディレクトリ名)はローカル同一性の正準リンクになるため
// 形式を機械保証する。小文字英数とハイフンのみ、48 文字以内。
const STORE_ID_RE = /^[a-z0-9-]{1,48}$/
// Windows 予約デバイス名。ローカル展開時にファイル/ディレクトリ名として使えない。
const WINDOWS_RESERVED_RE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/

const errors = []
const warnings = []

// notedeck#913: レジストリ全体(全 kind 横断)の ID 重複検査用
const idOwners = new Map() // storeId → ['kind/id', ...]
// notedeck#913: テーマ内部 ID(theme.json5 の id)の一意性検査用
const themeInternalIds = new Map() // 内部 id → [storeId, ...]

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

// skill.md の YAML frontmatter から id を取り出す。
// build-registry.js の parseFrontmatter と同じく浅い frontmatter のみ想定。
function frontmatterId(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^id\s*:\s*(.*)$/)
    if (!kv) continue
    const v = kv[1].trim()
    return /^".*"$/.test(v) || /^'.*'$/.test(v) ? v.slice(1, -1) : v
  }
  return null
}

for (const [kind, sourceName] of Object.entries(KINDS)) {
  const kindDir = join(REGISTRY_DIR, kind)
  for (const id of scanDirs(kindDir)) {
    const itemDir = join(kindDir, id)
    const label = `${kind}/${id}`

    // notedeck#913: storeId(ディレクトリ名)の形式検査
    if (!STORE_ID_RE.test(id)) {
      errors.push(`[${label}] storeId(ディレクトリ名)が不正 — ^[a-z0-9-]{1,48}$ に一致しない`)
    } else if (WINDOWS_RESERVED_RE.test(id)) {
      errors.push(`[${label}] storeId が Windows 予約デバイス名(${id})`)
    }

    // notedeck#913: 全 kind 横断の ID 重複検査(収集。判定はループ後)
    if (!idOwners.has(id)) idOwners.set(id, [])
    idOwners.get(id).push(label)

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

    // meta.json(skills は持たず skill.md の frontmatter が同じ役割)
    const metaPath = join(itemDir, 'meta.json')
    if (kind === 'skills') {
      // S11 / notedeck#913: skills も frontmatter の id = ディレクトリ名を強制。
      // ここを素通しすると skills だけアイテム乗っ取り経路が残る。
      if (existsSync(sourcePath)) {
        const fmId = frontmatterId(readFileSync(sourcePath, 'utf-8'))
        if (fmId == null) {
          errors.push(`[${label}] skill.md の frontmatter に id が無い`)
        } else if (fmId !== id) {
          errors.push(`[${label}] frontmatter の id (${fmId}) がディレクトリ名 (${id}) と不一致 — アイテム乗っ取りの温床`)
        }
      }
    } else {
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

    // notedeck#913: テーマ内部 ID(theme.json5 の id)の収集(判定はループ後)。
    // id 欠損は現状データで許容されているため fail にせず、重複のみ弾く。
    if (kind === 'themes' && existsSync(sourcePath)) {
      let theme
      try {
        theme = JSON5.parse(readFileSync(sourcePath, 'utf-8'))
      } catch {
        errors.push(`[${label}] theme.json5 が JSON5 として解釈できない`)
        theme = {}
      }
      if (theme.id != null) {
        if (!themeInternalIds.has(theme.id)) themeInternalIds.set(theme.id, [])
        themeInternalIds.get(theme.id).push(id)
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

// notedeck#913: レジストリ全体(全 kind 横断)で storeId は一意
for (const [id, owners] of idOwners) {
  if (owners.length > 1) {
    errors.push(`[registry] ID "${id}" が重複: ${owners.join(', ')} — storeId はレジストリ全体で一意`)
  }
}
// notedeck#913: テーマ内部 ID の一意性
for (const [tid, dirs] of themeInternalIds) {
  if (dirs.length > 1) {
    errors.push(`[themes] theme.json5 の内部 ID "${tid}" が重複: ${dirs.join(', ')}`)
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`)
for (const e of errors) console.error(`ERROR ${e}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} 件のエラー。詳細は docs/design/security.md の S9/S11/S12 を参照。`)
  process.exit(1)
}
console.log(`レジストリ完全性チェック OK(警告 ${warnings.length} 件)`)
