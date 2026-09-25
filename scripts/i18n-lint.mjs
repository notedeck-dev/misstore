// UI 辞書の訳の置き去りを検出する (notedeck の docs-lint と同じ方式)。
// 訳は原文 ja.ts の内容ハッシュを `sourceHash: <hash>` コメントで持つ。原文が変わると
// ハッシュがずれるので、訳を置き去りにしたまま原文だけ更新できない。
// キーの過不足は vue-tsc (Messages 型) が落とすので、ここは中身の追従だけを見る

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIR = join(ROOT, 'src/i18n')
const SOURCE = join(DIR, 'ja.ts')
const SOURCE_HASH = /sourceHash:\s*(\S+)/

const current = createHash('sha256').update(readFileSync(SOURCE)).digest('hex').slice(0, 12)
const translations = readdirSync(DIR).filter((f) => /^[a-z-]+\.ts$/i.test(f) && f !== 'ja.ts' && f !== 'index.ts')

let stale = 0
for (const f of translations) {
  const file = join(DIR, f)
  const name = relative(ROOT, file)
  const recorded = readFileSync(file, 'utf8').match(SOURCE_HASH)?.[1]
  if (recorded === current) continue
  console.error(
    recorded
      ? `${name}  原文 src/i18n/ja.ts が訳の後に更新された。訳を追従させてから sourceHash を ${current} にする`
      : `${name}  sourceHash が無い。原文 src/i18n/ja.ts から訳したなら sourceHash: ${current} を書く`,
  )
  stale++
}
if (stale > 0) {
  console.error(`\n訳の置き去り ${stale} 件。git diff で原文の差分を見て訳に反映する。`)
  process.exit(1)
}
console.log(`i18n-lint: ${translations.length} ファイル、問題なし`)
