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
  capabilities: WidgetCapability[]
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

export type WidgetCapability =
  | 'misskey-api'
  | 'misskey-account'
  | 'notedeck-api'

export const WIDGET_CAPABILITY_LABELS: Record<WidgetCapability, string> = {
  'misskey-api': 'Misskey API',
  'misskey-account': 'Account',
  'notedeck-api': 'NoteDeck API',
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
  skills?: T[]
}

export type StoreTab = 'home' | 'plugins' | 'themes' | 'widgets' | 'skills'
