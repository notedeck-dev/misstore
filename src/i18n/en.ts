// 原文 ja.ts から訳した時点のハッシュ。scripts/i18n-lint.mjs が訳の置き去りを検出する
// sourceHash: cfd6bd8589f0

import type { Messages } from './ja'

const en: Messages = {
  nav: {
    menu: 'Menu',
    search: 'Search extensions…',
    colorMode: (mode: string) => `Toggle color mode (${mode})`,
    colorModes: {
      system: 'Follow system',
      light: 'Light mode',
      dark: 'Dark mode',
    },
    language: 'Language',
  },
  home: {
    sub: 'From themes to skills. Find it, read it, install it.',
    chip: 'Misskey / NoteDeck',
    heroSearch: 'Search themes, plugins, widgets, queries and skills…',
    notice: 'Publish your extension with a GitHub pull request',
    searchTitle: (q: string) => `Results for “${q}”`,
    searchNote: (n: number) => `${n} ${n === 1 ? 'result' : 'results'} across all kinds.`,
    seeAll: 'See all',
    browse: 'Browse',
    kinds: {
      themes: 'Color schemes for Misskey / NoteDeck',
      plugins: 'AiScript plugins for Misskey',
      widgets: 'Widgets for your NoteDeck deck',
      queries: 'Column filter expressions for NoteDeck',
      skills: 'Skills for the NoteDeck AI',
    },
    latest: 'Latest',
    contribute: {
      title: 'Publish an extension',
      body: 'No login, no account. Open a GitHub pull request and the source is distributed as-is. Whatever passes review and the CI checks shows up here.',
      guide: 'Contributing guide',
      format: 'Registry format',
    },
  },
  catalog: {
    results: (n: number) => `${n} ${n === 1 ? 'result' : 'results'}`,
    sortBy: 'Sort by',
    server: 'Server',
    serverHint: 'Hostname of the Misskey server to install on',
    searchIn: (kind: string) => `Search ${kind}…`,
  },
  footer: {
    say: 'An extension store for NoteDeck / Misskey. The catalog is static JSON, so any client can read it.',
    links: 'Related links',
  },
  install: {
    ready: 'Install on Misskey',
    needHost: 'Enter your server hostname in the Server field',
    hint: 'Enter your Misskey server hostname and press Install to open the server’s confirmation screen.',
  },
  integrity: {
    note: 'SHA-512 checksum of the distributed source. Use it to verify before installing.',
  },
  code: {
    copy: 'Copy code',
    copied: 'Copied',
  },
  detail: {
    standalone: 'Standalone — works without external services',
    noPermissions: 'No additional permissions requested',
  },
  query: {
    // NoteDeck の UI は日本語のみなので、UI 名は原語を併記する
    usageBefore: 'An AiScript filter query to paste into a NoteDeck column’s settings (カラム設定). Only notes for which the expression returns',
    usageAfter: 'are shown.',
  },
}

export default en
