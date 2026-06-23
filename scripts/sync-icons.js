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
  'plugins/youtube-link-cleaner': { pack: 'simple', name: 'youtube' },
  'widgets/button': { pack: 'lucide', name: 'mouse-pointer-click' },
  'widgets/calendar': { pack: 'lucide', name: 'calendar' },
  'widgets/crypto': { pack: 'lucide', name: 'bitcoin' },
  'widgets/digital-clock': { pack: 'lucide', name: 'clock' },
  'widgets/github-releases': { pack: 'lucide', name: 'rocket' },
  'widgets/memo': { pack: 'lucide', name: 'notebook-pen' },
  'widgets/online-users': { pack: 'lucide', name: 'users' },
  'widgets/poll': { pack: 'lucide', name: 'vote' },
  'widgets/post-form': { pack: 'lucide', name: 'square-pen' },
  'widgets/profile': { pack: 'lucide', name: 'circle-user' },
  'widgets/server-info': { pack: 'lucide', name: 'server' },
  'widgets/stocks': { pack: 'lucide', name: 'trending-up' },
  'skills/post-helper': { pack: 'lucide', name: 'wand-sparkles' },
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
