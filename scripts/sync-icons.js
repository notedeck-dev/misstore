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
  'plugins/kakuyomu-ruby': { pack: 'lucide', name: 'languages' },
  'plugins/live-hashtag': { pack: 'lucide', name: 'hash' },
  'plugins/note-attachments-download': { pack: 'lucide', name: 'download' },
  'plugins/plugin-smith': { pack: 'lucide', name: 'hammer' },
  'plugins/reaction-piggyback': { pack: 'lucide', name: 'heart-handshake' },
  'plugins/same-emoji-react': { pack: 'lucide', name: 'smile-plus' },
  'plugins/smart-delete': { pack: 'lucide', name: 'trash-2' },
  'plugins/tech-autolink': { pack: 'lucide', name: 'link' },
  'plugins/youtube-link-cleaner': { pack: 'simple', name: 'youtube' },
  'plugins/open-in-web': { pack: 'lucide', name: 'external-link' },
  'plugins/twitter-link-fixer': { pack: 'simple', name: 'x' },
  'plugins/web-search': { pack: 'lucide', name: 'text-search' },
  'plugins/ai-actions': { pack: 'lucide', name: 'sparkles' },
  'plugins/keyword-alert': { pack: 'lucide', name: 'bell-ring' },
  'plugins/quick-clip': { pack: 'lucide', name: 'paperclip' },
  'plugins/vip-notify': { pack: 'lucide', name: 'bell-plus' },
  'plugins/spoiler-guard': { pack: 'lucide', name: 'eye-off' },
  'plugins/misskey-translate': { pack: 'lucide', name: 'languages' },
  'plugins/thread-to-memo': { pack: 'lucide', name: 'messages-square' },
  'plugins/column-presets': { pack: 'lucide', name: 'columns-3' },
  'plugins/time-theme-switcher': { pack: 'lucide', name: 'sun-moon' },
  'plugins/list-adder': { pack: 'lucide', name: 'list-plus' },
  'plugins/antenna-notifier': { pack: 'lucide', name: 'antenna' },
  'plugins/night-post-guard': { pack: 'lucide', name: 'moon-star' },
  'plugins/cw-trust': { pack: 'lucide', name: 'eye' },
  'plugins/daily-note': { pack: 'lucide', name: 'calendar-days' },
  'plugins/reading-list': { pack: 'lucide', name: 'bookmark-plus' },
  'plugins/vrc-in-here': { pack: 'simple', name: 'vrchat' },
  'widgets/atcoder': { pack: 'lucide', name: 'trophy' },
  'widgets/button': { pack: 'lucide', name: 'mouse-pointer-click' },
  'widgets/calendar': { pack: 'lucide', name: 'calendar' },
  'widgets/clickup': { pack: 'simple', name: 'clickup' },
  'widgets/commafeed': { pack: 'lucide', name: 'newspaper' },
  'widgets/crypto': { pack: 'simple', name: 'bitcoin' },
  'widgets/ctftime': { pack: 'lucide', name: 'flag' },
  'widgets/digital-clock': { pack: 'lucide', name: 'clock' },
  'widgets/discord-online': { pack: 'simple', name: 'discord' },
  'widgets/discord-presence': { pack: 'simple', name: 'discord' },
  'widgets/drive-sweeper': { pack: 'lucide', name: 'recycle' },
  'widgets/github-releases': { pack: 'simple', name: 'github' },
  'widgets/hackerone': { pack: 'simple', name: 'hackerone' },
  'widgets/memo': { pack: 'lucide', name: 'notebook-pen' },
  'widgets/mewk': { pack: 'lucide', name: 'cat' },
  'widgets/minecraft': { pack: 'lucide', name: 'box' },
  'widgets/misskey-online': { pack: 'simple', name: 'misskey' },
  'widgets/nodeinfo': { pack: 'lucide', name: 'scan-search' },
  'widgets/okj-prices': { pack: 'lucide', name: 'chart-candlestick' },
  'widgets/osv-vulns': { pack: 'lucide', name: 'package-search' },
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
  // Shodan 公式ロゴは simple-icons (CC0) に無く、商標のため手貼りしない。
  // 「スキャン」を想起させる汎用 radar で代替 (meta.icon の ti-radar と対)。
  'widgets/shodan-instance-audit': { pack: 'lucide', name: 'radar' },
  'widgets/steam': { pack: 'simple', name: 'steam' },
  'widgets/osu-stats': { pack: 'simple', name: 'osu' },
  'widgets/nicolive-watch': { pack: 'simple', name: 'niconico' },
  'widgets/vocaloid-trending': { pack: 'simple', name: 'niconico' },
  'widgets/soundcloud-feed': { pack: 'simple', name: 'soundcloud' },
  // CHUNITHM / chunirec のロゴは simple-icons に無く、商標のため手貼りしない。
  // 音ゲーを想起させる汎用 music で代替 (meta.icon の ti-music と対)。
  'widgets/chunithm-rating': { pack: 'lucide', name: 'music' },
  'widgets/stocks': { pack: 'lucide', name: 'trending-up' },
  'widgets/todoist': { pack: 'simple', name: 'todoist' },
  'widgets/wakatime': { pack: 'simple', name: 'wakatime' },
  'widgets/mood-tracker': { pack: 'lucide', name: 'smile' },
  'widgets/wellbeing': { pack: 'lucide', name: 'heart-pulse' },
  'widgets/zenn': { pack: 'simple', name: 'zenn' },
  'widgets/notification-digest': { pack: 'lucide', name: 'bell-dot' },
  'widgets/memo-inbox': { pack: 'lucide', name: 'inbox' },
  'widgets/antenna-peek': { pack: 'lucide', name: 'antenna' },
  'widgets/health-monitor': { pack: 'lucide', name: 'activity' },
  'widgets/aiscript-health': { pack: 'lucide', name: 'bug' },
  'widgets/birthday-today': { pack: 'lucide', name: 'cake' },
  'widgets/my-activity-chart': { pack: 'lucide', name: 'chart-column' },
  'widgets/server-trend-chart': { pack: 'lucide', name: 'chart-line' },
  'widgets/drafts-tray': { pack: 'lucide', name: 'file-pen-line' },
  'widgets/note-context': { pack: 'lucide', name: 'crosshair' },
  'widgets/announcements': { pack: 'lucide', name: 'megaphone' },
  'widgets/keybinds-cheatsheet': { pack: 'lucide', name: 'keyboard' },
  'widgets/reply-queue': { pack: 'lucide', name: 'message-square-reply' },
  'widgets/federation-radar': { pack: 'lucide', name: 'radar' },
  'widgets/reading-list-widget': { pack: 'lucide', name: 'book-open-check' },
  'widgets/emoji-usage': { pack: 'lucide', name: 'thumbs-up' },
  'queries/keyword-hide': { pack: 'lucide', name: 'volume-x' },
  'queries/local-only': { pack: 'lucide', name: 'map-pin' },
  'queries/calm-timeline': { pack: 'lucide', name: 'coffee' },
  'queries/quotes-only': { pack: 'lucide', name: 'quote' },
  'queries/topic-watch': { pack: 'lucide', name: 'rss' },
  'queries/no-cw': { pack: 'lucide', name: 'eye-off' },
  'queries/non-public-only': { pack: 'lucide', name: 'lock' },
  'queries/server-only': { pack: 'lucide', name: 'server' },
  'queries/hashtag-watch': { pack: 'lucide', name: 'hash' },
  'queries/no-federation': { pack: 'lucide', name: 'unplug' },
  'queries/text-only': { pack: 'lucide', name: 'text' },
  'queries/remote-only': { pack: 'lucide', name: 'globe' },
  'queries/public-only': { pack: 'lucide', name: 'unlock' },
  'queries/user-hide': { pack: 'lucide', name: 'user-round-x' },
  'queries/server-hide': { pack: 'lucide', name: 'server-off' },
  'queries/link-only': { pack: 'lucide', name: 'link' },
  'queries/no-link': { pack: 'lucide', name: 'unlink' },
  'queries/reaction-boost': { pack: 'lucide', name: 'flame' },
  'queries/renote-boost': { pack: 'lucide', name: 'repeat-2' },
  'queries/discussion-watch': { pack: 'lucide', name: 'messages-square' },
  'queries/reacted-hide': { pack: 'lucide', name: 'check-check' },
  'queries/channel-only': { pack: 'lucide', name: 'tv' },
  'queries/bot-only': { pack: 'lucide', name: 'bot' },
  'queries/video-only': { pack: 'lucide', name: 'video' },
  'queries/long-hide': { pack: 'lucide', name: 'minimize-2' },
  'queries/long-only': { pack: 'lucide', name: 'scroll-text' },
  'queries/spam-guard': { pack: 'lucide', name: 'shield-ban' },
  'queries/foreign-reply-hide': { pack: 'lucide', name: 'message-square-off' },
  'queries/yami-hide': { pack: 'lucide', name: 'moon' },
  'skills/mfm-art': { pack: 'lucide', name: 'palette' },
  'skills/mfm-reference': { pack: 'lucide', name: 'book-open' },
  'skills/post-helper': { pack: 'lucide', name: 'wand-sparkles' },
  'skills/repost-sentinel': { pack: 'lucide', name: 'radar' },
  'skills/summarizer': { pack: 'lucide', name: 'align-left' },
  'skills/translator': { pack: 'lucide', name: 'languages' },
  'skills/skill-gardener': { pack: 'lucide', name: 'sprout' },
  'skills/improvement-pulse': { pack: 'lucide', name: 'activity' },
  'skills/aiscript-surgeon': { pack: 'lucide', name: 'stethoscope' },
  'skills/query-author': { pack: 'lucide', name: 'filter' },
  'skills/archive-navigator': { pack: 'lucide', name: 'compass' },
  // NoteDeck 同梱から移した作者系 (notedeck#969)。生成系は道具、
  // リファレンス系は本で揃える
  'skills/plugin-author': { pack: 'lucide', name: 'plug' },
  'skills/widget-author': { pack: 'lucide', name: 'blocks' },
  'skills/theme-author': { pack: 'lucide', name: 'paintbrush' },
  'skills/skill-author': { pack: 'lucide', name: 'pen-tool' },
  'skills/aiscript-author': { pack: 'lucide', name: 'file-code' },
  'skills/theme-reference': { pack: 'lucide', name: 'swatch-book' },
  'skills/seasonal-theme': { pack: 'lucide', name: 'leaf' },
  'skills/writing-coach': { pack: 'lucide', name: 'spell-check' },
  'skills/notedeck-guide': { pack: 'lucide', name: 'life-buoy' },
  'skills/notedeck-memo': { pack: 'lucide', name: 'sticky-note' },
  'skills/self-profile': { pack: 'lucide', name: 'user-round-cog' },
  'skills/memo-gardener': { pack: 'lucide', name: 'sprout' },
  'skills/notification-triage': { pack: 'lucide', name: 'inbox' },
  'skills/antenna-digest': { pack: 'lucide', name: 'antenna' },
  'skills/clip-librarian': { pack: 'lucide', name: 'library-big' },
  'skills/play-inspector': { pack: 'lucide', name: 'search-code' },
  'skills/deck-architect': { pack: 'lucide', name: 'layout-dashboard' },
  'skills/css-author': { pack: 'lucide', name: 'paintbrush' },
  'skills/store-concierge': { pack: 'lucide', name: 'concierge-bell' },
  'skills/plugin-auditor': { pack: 'lucide', name: 'scan-search' },
  'skills/query-auditor': { pack: 'lucide', name: 'list-filter' },
  'skills/memo-recap': { pack: 'lucide', name: 'calendar-range' },
  'skills/trend-explainer': { pack: 'lucide', name: 'trending-up' },
  'skills/self-privacy-audit': { pack: 'lucide', name: 'shield-user' },
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
