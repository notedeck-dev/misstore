#!/usr/bin/env node

// Copies SVG icons from lucide-static / simple-icons into each item's
// public/registry/<kind>/<id>/icon.svg. Run via `pnpm icons:sync`.
// Edit ICON_MAP below to add or change icons.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LUCIDE_DIR = resolve(ROOT, 'node_modules/lucide-static/icons')
const SIMPLE_DIR = resolve(ROOT, 'node_modules/simple-icons/icons')

// pack: 'lucide' (ISC, generic UI/concept) or 'simple' (CC0, brand logos)
const ICON_MAP = {
  'plugins/block-checker': { pack: 'lucide', name: 'user-x' },
  'plugins/block-combo': { pack: 'lucide', name: 'heart-crack' },
  'plugins/federation-checker': { pack: 'lucide', name: 'satellite-dish' },
  'plugins/live-hashtag': { pack: 'lucide', name: 'hash' },
  'plugins/plugin-smith': { pack: 'lucide', name: 'hammer' },
  'plugins/youtube-link-cleaner': { pack: 'simple', name: 'youtube' },
  'plugins/open-in-web': { pack: 'lucide', name: 'external-link' },
  'plugins/twitter-link-fixer': { pack: 'simple', name: 'x' },
  'plugins/web-search': { pack: 'lucide', name: 'text-search' },
  'widgets/atcoder': { pack: 'lucide', name: 'trophy' },
  'widgets/button': { pack: 'lucide', name: 'mouse-pointer-click' },
  'widgets/calendar': { pack: 'lucide', name: 'calendar' },
  'widgets/clickup': { pack: 'simple', name: 'clickup' },
  'widgets/commafeed': { pack: 'lucide', name: 'newspaper' },
  'widgets/crypto': { pack: 'simple', name: 'bitcoin' },
  'widgets/ctftime': { pack: 'lucide', name: 'flag' },
  'widgets/digital-clock': { pack: 'lucide', name: 'clock' },
  'widgets/discord-online': { pack: 'simple', name: 'discord' },
  'widgets/github-releases': { pack: 'simple', name: 'github' },
  'widgets/hackerone': { pack: 'simple', name: 'hackerone' },
  'widgets/memo': { pack: 'lucide', name: 'notebook-pen' },
  'widgets/mewk': { pack: 'lucide', name: 'cat' },
  'widgets/minecraft': { pack: 'lucide', name: 'box' },
  'widgets/misskey-online': { pack: 'simple', name: 'misskey' },
  'widgets/onedraw-timer': { pack: 'lucide', name: 'timer' },
  // 本家 misskey-tools のミス廃アラートは fa-tower-broadcast
  'widgets/misuhai-score': { pack: 'lucide', name: 'radio-tower' },
  'widgets/online-users': { pack: 'lucide', name: 'users' },
  'widgets/poll': { pack: 'lucide', name: 'vote' },
  'widgets/post-form': { pack: 'lucide', name: 'square-pen' },
  'widgets/profile': { pack: 'lucide', name: 'circle-user' },
  'widgets/reversi-record': { pack: 'lucide', name: 'circle-dot' },
  'widgets/reversi-rating': { pack: 'lucide', name: 'trophy' },
  'widgets/rss-reader': { pack: 'simple', name: 'rss' },
  'widgets/server-info': { pack: 'lucide', name: 'server' },
  'widgets/steam': { pack: 'simple', name: 'steam' },
  'widgets/stocks': { pack: 'lucide', name: 'trending-up' },
  'widgets/todoist': { pack: 'simple', name: 'todoist' },
  'widgets/wakatime': { pack: 'simple', name: 'wakatime' },
  'widgets/wellbeing': { pack: 'lucide', name: 'heart-pulse' },
  'widgets/zenn': { pack: 'simple', name: 'zenn' },
  'styles/square-ui': { pack: 'lucide', name: 'square' },
  'styles/rocket-cursor': { pack: 'lucide', name: 'rocket' },
  'styles/no-animations': { pack: 'lucide', name: 'zap-off' },
  'skills/mfm-art': { pack: 'lucide', name: 'palette' },
  'skills/mfm-reference': { pack: 'lucide', name: 'book-open' },
  'skills/post-helper': { pack: 'lucide', name: 'wand-sparkles' },
  'skills/repost-sentinel': { pack: 'lucide', name: 'radar' },
  'skills/summarizer': { pack: 'lucide', name: 'align-left' },
  'skills/translator': { pack: 'lucide', name: 'languages' },
}

function sourceFor(pack, name) {
  if (pack === 'lucide') return join(LUCIDE_DIR, `${name}.svg`)
  if (pack === 'simple') return join(SIMPLE_DIR, `${name}.svg`)
  throw new Error(`unknown pack: ${pack}`)
}

// simple-icons SVGs have no fill on the root, so a bare <img>/mask renders as
// the canvas default. Inject fill="currentColor" so consumers can recolor via
// CSS color/currentColor (Notedeck and the store both rely on this).
function transform(content, pack) {
  let s = content.replace(/<!--[\s\S]*?-->\s*/g, '').trim()
  if (pack === 'simple' && !/<svg[^>]*\bfill=/.test(s)) {
    s = s.replace(/<svg/, '<svg fill="currentColor"')
  }
  return s + '\n'
}

let synced = 0
const errors = []
for (const [target, src] of Object.entries(ICON_MAP)) {
  const srcPath = sourceFor(src.pack, src.name)
  if (!existsSync(srcPath)) {
    errors.push(`[${target}] source not found: ${src.pack}/${src.name}`)
    continue
  }
  const dst = resolve(ROOT, 'public/registry', target, 'icon.svg')
  const content = readFileSync(srcPath, 'utf-8')
  writeFileSync(dst, transform(content, src.pack))
  console.log(`✓ ${target}  ←  ${src.pack}/${src.name}`)
  synced++
}

console.log(`\nsynced ${synced} icon(s)`)
if (errors.length) {
  console.error('\nErrors:')
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
