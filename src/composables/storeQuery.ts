import type { StoreTab } from '@/types'

/**
 * ストアの絞り込み状態 ⇄ URL クエリ。
 * 例: /?tab=plugins&category=utility&sort=newest&standard=1&q=timeline
 * 既定値 (home / 名前順 / トグル off / 空検索) は省いて共有 URL を短く保つ。
 */
export interface StoreQueryState {
  tab: StoreTab
  query: string
  category: string
  sort: 'name' | 'newest'
  onlyMisskeyWeb: boolean
  onlyStandardProfile: boolean
}

export const STORE_QUERY_KEYS = ['tab', 'q', 'category', 'sort', 'misskeyWeb', 'standard'] as const

const TABS: readonly string[] = ['themes', 'plugins', 'widgets', 'queries', 'skills']

/** vue-router の LocationQuery 値 (string | null | 配列) から先頭の文字列を取る */
export function firstParam(v: unknown): string {
  const s = Array.isArray(v) ? v[0] : v
  return typeof s === 'string' ? s : ''
}

export function parseStoreQuery(q: Record<string, unknown>): StoreQueryState {
  const tab = firstParam(q.tab)
  return {
    tab: TABS.includes(tab) ? (tab as StoreTab) : 'home',
    query: firstParam(q.q),
    category: firstParam(q.category),
    sort: firstParam(q.sort) === 'newest' ? 'newest' : 'name',
    onlyMisskeyWeb: firstParam(q.misskeyWeb) === '1',
    onlyStandardProfile: firstParam(q.standard) === '1',
  }
}

export function toStoreQuery(s: StoreQueryState): Record<string, string> {
  const q: Record<string, string> = {}
  if (s.tab !== 'home') q.tab = s.tab
  if (s.query.trim()) q.q = s.query
  // home は種別をまたぐ検索だけ。カテゴリや並び順は種別タブにしか無い
  if (s.tab === 'home') return q
  if (s.category) q.category = s.category
  if (s.sort !== 'name') q.sort = s.sort
  if (s.onlyMisskeyWeb) q.misskeyWeb = '1'
  if (s.onlyStandardProfile) q.standard = '1'
  return q
}
