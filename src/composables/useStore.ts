import { computed, ref, watch } from 'vue'
import type { PluginEntry, StoreTab, ThemeEntry } from '@/types'

const plugins = ref<PluginEntry[]>([])
const themes = ref<ThemeEntry[]>([])
const loaded = ref(false)
const error = ref(false)
const activeTab = ref<StoreTab>('plugins')
const query = ref('')
const category = ref('')
const sort = ref<'name' | 'newest'>('name')

// Misskey server hostname for install-extensions links
const misskeyHost = ref(localStorage.getItem('misstore:misskeyHost') ?? '')

watch(misskeyHost, (v) => {
  localStorage.setItem('misstore:misskeyHost', v)
})

async function load() {
  try {
    const [pRes, tRes] = await Promise.all([
      fetch('/registry/plugins.json'),
      fetch('/registry/themes.json'),
    ])
    const pData = await pRes.json()
    const tData = await tRes.json()
    plugins.value = pData.plugins ?? []
    themes.value = tData.themes ?? []
    loaded.value = true
  } catch {
    error.value = true
  }
}

const filteredPlugins = computed(() => {
  let items = [...plugins.value]
  const q = query.value.toLowerCase().trim()
  if (q) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }
  if (category.value) {
    items = items.filter((p) => p.category === category.value)
  }
  return sortItems(items)
})

const filteredThemes = computed(() => {
  let items = [...themes.value]
  const q = query.value.toLowerCase().trim()
  if (q) {
    items = items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }
  if (category.value) {
    items = items.filter((t) => t.base === category.value)
  }
  return sortItems(items)
})

function sortItems<T extends { name: string; createdAt: string }>(
  items: T[],
): T[] {
  if (sort.value === 'newest') {
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

const pluginCategories = computed(() => [
  ...new Set(plugins.value.map((p) => p.category)),
])
const resultCount = computed(() =>
  activeTab.value === 'plugins'
    ? filteredPlugins.value.length
    : filteredThemes.value.length,
)

function buildInstallUrl(apiUrl: string, sha512: string): string | null {
  const host = misskeyHost.value.trim()
  if (!host) return null
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${cleanHost}/install-extensions?url=${encodeURIComponent(apiUrl)}&hash=${sha512}`
}

// Reset category when switching tabs
watch(activeTab, () => {
  category.value = ''
  query.value = ''
})

function findPlugin(id: string) {
  return computed(() => plugins.value.find((p) => p.id === id) ?? null)
}

function findTheme(id: string) {
  return computed(() => themes.value.find((t) => t.id === id) ?? null)
}

export function useStore() {
  if (!loaded.value && !error.value) load()
  return {
    plugins,
    themes,
    loaded,
    error,
    activeTab,
    query,
    category,
    sort,
    misskeyHost,
    filteredPlugins,
    filteredThemes,
    pluginCategories,
    resultCount,
    buildInstallUrl,
    findPlugin,
    findTheme,
  }
}
