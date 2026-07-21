export interface PluginEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  category: PluginCategory
  tags: string[]
  sourceUrl: string
  apiUrl: string
  sha512: string
  createdAt: string
  updatedAt: string
  authorUrl?: string
  license?: string
  repository?: string
  permissions?: string[]
  capabilities?: StoreCapability[]
  iconUrl?: string
}

export type PluginCategory =
  | 'posting'
  | 'timeline'
  | 'moderation'
  | 'utility'
  | 'integration'
  | 'appearance'
  | 'other'

export const PLUGIN_CATEGORY_LABELS: Record<PluginCategory, string> = {
  posting: 'Posting',
  timeline: 'Timeline',
  moderation: 'Moderation',
  utility: 'Utility',
  integration: 'Integration',
  appearance: 'Appearance',
  other: 'Other',
}

export interface ThemeEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  base: 'dark' | 'light'
  tags: string[]
  sourceUrl: string
  apiUrl: string
  sha512: string
  createdAt: string
  updatedAt: string
  themeProps: Record<string, string>
  authorUrl?: string
  license?: string
  repository?: string
}

export interface WidgetEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  icon: string
  autoRun: boolean
  category: WidgetCategory
  capabilities: StoreCapability[]
  tags: string[]
  sourceUrl: string
  apiUrl: string
  sha512: string
  createdAt: string
  updatedAt: string
  authorUrl?: string
  license?: string
  repository?: string
  iconUrl?: string
}

export type WidgetCategory = 'display' | 'input' | 'stats'

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  display: 'Display',
  input: 'Input',
  stats: 'Stats',
}

// widget / plugin 共通。NoteDeck 側の install 互換判定と対応 (checkWidgetCapabilities 参照)
export type StoreCapability =
  | 'misskey-api'
  | 'misskey-account'
  | 'notedeck-api'
  | 'secret-vault'

export const CAPABILITY_LABELS: Record<StoreCapability, string> = {
  'misskey-api': 'Misskey API',
  'misskey-account': 'Account',
  'notedeck-api': 'NoteDeck API',
  'secret-vault': 'Secret Vault',
}

// NoteDeck のカラムフィルタクエリ (notedeck#783)。
// AiScript 式で「true = 表示」。配布はソースのみで、適用側が必ず再コンパイルする。
export interface QueryEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  category: QueryCategory
  tags: string[]
  sourceUrl: string
  apiUrl: string
  sha512: string
  createdAt: string
  updatedAt: string
  authorUrl?: string
  license?: string
  repository?: string
  iconUrl?: string
}

// mute = ノイズを減らす系 / focus = 特定のノートに絞る系
export type QueryCategory = 'mute' | 'focus' | 'other'

export const QUERY_CATEGORY_LABELS: Record<QueryCategory, string> = {
  mute: 'Mute',
  focus: 'Focus',
  other: 'Other',
}

export interface SkillEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  category: SkillCategory
  mode: SkillMode
  triggers: string[]
  scope: SkillScope
  tags: string[]
  sourceUrl: string
  apiUrl: string
  sha512: string
  createdAt: string
  updatedAt: string
  authorUrl?: string
  license?: string
  repository?: string
  builtIn?: boolean
  isPersona?: boolean
  iconUrl?: string
}

export type SkillCategory =
  | 'language'
  | 'composing'
  | 'analysis'
  | 'persona'
  | 'utility'

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  language: 'Language',
  composing: 'Composing',
  analysis: 'Analysis',
  persona: 'Persona',
  utility: 'Utility',
}

export type SkillMode = 'always' | 'manual' | 'trigger' | 'heartbeat'

export const SKILL_MODE_LABELS: Record<SkillMode, string> = {
  always: 'Always',
  manual: 'Manual',
  trigger: 'Trigger',
  heartbeat: 'Heartbeat',
}

export type SkillScope = 'global' | 'per-account'

export const SKILL_SCOPE_LABELS: Record<SkillScope, string> = {
  global: 'Global',
  'per-account': 'Per-account',
}

export interface RegistryIndex<T> {
  version: number
  updatedAt: string
  plugins?: T[]
  themes?: T[]
  widgets?: T[]
  queries?: T[]
  skills?: T[]
}

export type StoreTab =
  | 'home'
  | 'plugins'
  | 'themes'
  | 'widgets'
  | 'queries'
  | 'skills'
