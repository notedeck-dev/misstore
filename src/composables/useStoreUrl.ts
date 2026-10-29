import { nextTick, watch } from 'vue'
import { type LocationQuery, useRoute, useRouter } from 'vue-router'
import { useStore } from '@/composables/useStore'
import {
  STORE_QUERY_KEYS,
  type StoreQueryState,
  firstParam,
  parseStoreQuery,
  toStoreQuery,
} from '@/composables/storeQuery'

function hasStoreParams(q: LocationQuery) {
  return STORE_QUERY_KEYS.some((k) => k in q)
}

/**
 * ストアページの絞り込み状態を URL クエリと双方向に同期する。
 * 絞り込んだ結果の URL をそのまま共有でき、戻る/進むでも状態が復元される。
 * StorePage の setup から一度だけ呼ぶ。
 */
export function useStoreUrl() {
  const route = useRoute()
  const router = useRouter()
  const { activeTab, query, category, sort, onlyMisskeyWeb, onlyStandardProfile } = useStore()

  const state = (): StoreQueryState => ({
    tab: activeTab.value,
    query: query.value,
    category: category.value,
    sort: sort.value,
    onlyMisskeyWeb: onlyMisskeyWeb.value,
    onlyStandardProfile: onlyStandardProfile.value,
  })

  function apply(s: StoreQueryState) {
    // activeTab の watcher (sync) が他の絞り込みを消すので、タブを先に入れる
    activeTab.value = s.tab
    query.value = s.query
    category.value = s.category
    sort.value = s.sort
    onlyMisskeyWeb.value = s.onlyMisskeyWeb
    onlyStandardProfile.value = s.onlyStandardProfile
  }

  function nextQuery(s: StoreQueryState): LocationQuery {
    // ストア以外のパラメータは残す
    const rest = Object.fromEntries(
      Object.entries(route.query).filter(([k]) => !(STORE_QUERY_KEYS as readonly string[]).includes(k)),
    )
    return { ...rest, ...toStoreQuery(s) }
  }

  function sameStoreQuery(a: LocationQuery, b: LocationQuery) {
    return STORE_QUERY_KEYS.every((k) => firstParam(a[k]) === firstParam(b[k]))
  }

  // URL 由来の変更 (戻る/進む、不正値の正規化) は履歴に push しない。push すると戻るで元の URL に戻れなくなる
  let fromUrl = false
  function applyFromUrl(q: LocationQuery) {
    fromUrl = true
    apply(parseStoreQuery(q))
    nextTick(() => {
      fromUrl = false
    })
  }

  // 状態 → URL。ユーザーのタブ切り替えだけ履歴に残し、検索の打鍵などは置き換える
  watch(state, (s, prev) => {
    if (route.name !== 'store') return
    const q = nextQuery(s)
    if (sameStoreQuery(route.query, q)) return
    if (s.tab !== prev.tab && !fromUrl) router.push({ query: q })
    else router.replace({ query: q })
  })

  // URL → 状態 (戻る/進む、言語切り替えなど)。詳細ページへの遷移中は触らない
  watch(
    () => route.query,
    (q) => {
      if (route.name !== 'store') return
      applyFromUrl(q)
    },
  )

  // 初回: URL に指定があればそれを採用、無ければ今の状態 (詳細ページから戻った時のタブなど) を URL に写す
  if (hasStoreParams(route.query)) applyFromUrl(route.query)
  else {
    const q = nextQuery(state())
    if (!sameStoreQuery(route.query, q)) router.replace({ query: q })
  }
}
