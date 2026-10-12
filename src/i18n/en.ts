// 原文 ja.ts から訳した時点のハッシュ。scripts/i18n-lint.mjs が訳の置き去りを検出する
// sourceHash: 3249b1c61300

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
      start: 'Start a pull request (with template)',
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
  contract: {
    runsOnMisskeyWeb: 'Misskey Web OK',
    runsOnNotedeck: 'NoteDeck only',
    profile: {
      readonly: 'Read-only',
      safe: 'Safe profile',
      full: 'Full profile',
    },
    external: 'External',
    filterMisskeyWeb: 'Works on Misskey Web',
    filterStandard: 'Works on the default profile',
    title: 'Derived calls',
    note: 'Derived statically from the source. Not written in meta; CI flags any gap against the declared Permissions.',
    hooks: 'Hooks',
    externalLabel: 'External network',
    externalYes: 'Yes',
    externalNo: 'No',
    none: 'No Nd:call / Mk:api / hook calls',
    unresolved: (n: number) =>
      `${n} ${n === 1 ? 'call has' : 'calls have'} a config-derived target that cannot be resolved statically`,
    undeclared: (n: number) =>
      `${n} derived ${n === 1 ? 'permission is' : 'permissions are'} missing from the declared Permissions (dashed)`,
    declaredOnly: (keys: string[]) => `Declared but not derived from the source: ${keys.join(', ')}`,
    missing: 'No derived info yet (added on the next build)',
  },
  query: {
    // NoteDeck の UI は日本語のみなので、UI 名は原語を併記する
    usageBefore: 'An AiScript filter query to paste into a NoteDeck column’s settings (カラム設定). Only notes for which the expression returns',
    usageAfter: 'are shown.',
  },
}

export default en
