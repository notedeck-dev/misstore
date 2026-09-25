import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { ItemLocales } from '@/types'
import en from './en'
import ja, { type Messages } from './ja'

// ja は root のまま現行 URL を保ち、他の言語は /<key>/ を接頭辞にする (notedeck site と同じ)。
// 並び順は言語スイッチャーの表示順
export const LOCALES = {
  ja: { label: '日本語', messages: ja },
  en: { label: 'English', messages: en },
} satisfies Record<string, { label: string; messages: Messages }>

export type Locale = keyof typeof LOCALES

/** router の `/:locale(en)?` に使う。root の ja は含めない */
export const LOCALE_PREFIX_PATTERN = Object.keys(LOCALES).filter((k) => k !== 'ja').join('|')

export function localeOf(param: unknown): Locale {
  return typeof param === 'string' && param in LOCALES ? (param as Locale) : 'ja'
}

/** `/plugins/x` → ja ならそのまま、en なら `/en/plugins/x` */
export function withLocale(locale: Locale, path: string): string {
  if (locale === 'ja') return path
  return path === '/' ? `/${locale}/` : `/${locale}${path}`
}

/** UI の文言と、今の言語でのサイト内パス。言語は URL の接頭辞だけで決まる */
export function useI18n() {
  const route = useRoute()
  const locale = computed(() => localeOf(route.params.locale))
  const t = computed(() => LOCALES[locale.value].messages)
  const localePath = (path: string) => withLocale(locale.value, path)
  /** アイテムの name / description。訳が無ければ原文 */
  const itemText = (item: { name: string; description: string; locales?: ItemLocales }) => {
    const tr = item.locales?.[locale.value]
    return { name: tr?.name ?? item.name, description: tr?.description ?? item.description }
  }
  return { locale, t, localePath, itemText }
}
