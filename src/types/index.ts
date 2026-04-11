export interface PluginEntry {
  id: string
  name: string
  version: string
  author: string
  description: string
  category: PluginCategory
  tags: string[]
  sourceUrl: string
  createdAt: string
}

export type PluginCategory =
  | 'post-form'
  | 'note-action'
  | 'user-action'
  | 'note-filter'
  | 'post-filter'
  | 'utility'

export const PLUGIN_CATEGORY_LABELS: Record<PluginCategory, string> = {
  'post-form': 'Post Form',
  'note-action': 'Note Action',
  'user-action': 'User Action',
  'note-filter': 'Note Filter',
  'post-filter': 'Post Filter',
  'utility': 'Utility',
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
  previewColors: {
    bg: string
    fg: string
    panel: string
    accent: string
  }
  createdAt: string
}

export interface RegistryIndex<T> {
  version: number
  updatedAt: string
  plugins?: T[]
  themes?: T[]
}

export type StoreTab = 'plugins' | 'themes'
