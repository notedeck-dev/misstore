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
}

export interface RegistryIndex<T> {
  version: number
  updatedAt: string
  plugins?: T[]
  themes?: T[]
}

export type StoreTab = 'plugins' | 'themes'
