import { computed, ref, watch } from 'vue'
import type {
  PluginEntry,
  SkillEntry,
  StoreTab,
  ThemeEntry,
  WidgetEntry,
} from '@/types'

const plugins = ref<PluginEntry[]>([])
const themes = ref<ThemeEntry[]>([])
const widgets = ref<WidgetEntry[]>([])
const skills = ref<SkillEntry[]>([])
const loaded = ref(false)
const error = ref(false)
const activeTab = ref<StoreTab>('home')
const query = ref('')
const category = ref('')
const sort = ref<'name' | 'newest'>('name')

// Misskey server hostname for install-extensions links
const misskeyHost = ref(localStorage.getItem('misstore:misskeyHost') ?? '')

watch(misskeyHost, (v) => {
  localStorage.setItem('misstore:misskeyHost', v)
})

// Rebase the registry's absolute iconUrl (built with the production origin)
// onto the current page origin so dev and prod both resolve to the same host
// the registry itself was served from. External consumers (Notedeck etc.)
// keep using the absolute URL as-is.
function rebaseIconUrl<T extends { iconUrl?: string }>(item: T): T {
  if (!item.iconUrl) return item
  try {
    const u = new URL(item.iconUrl)
    return { ...item, iconUrl: window.location.origin + u.pathname }
  } catch {
    return item
  }
}

async function load() {
  try {
    const [pRes, tRes, wRes, sRes] = await Promise.all([
      fetch('/registry/plugins.json'),
      fetch('/registry/themes.json'),
      fetch('/registry/widgets.json'),
      fetch('/registry/skills.json'),
    ])
    const pData = await pRes.json()
    const tData = await tRes.json()
    const wData = await wRes.json()
    const sData = sRes.ok ? await sRes.json() : { skills: [] }
    plugins.value = (pData.plugins ?? []).map(rebaseIconUrl)
    themes.value = tData.themes ?? []
    widgets.value = (wData.widgets ?? []).map(rebaseIconUrl)
    skills.value = (sData.skills ?? []).map(rebaseIconUrl)
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

const filteredWidgets = computed(() => {
  let items = [...widgets.value]
  const q = query.value.toLowerCase().trim()
  if (q) {
    items = items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.author.toLowerCase().includes(q) ||
        w.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }
  if (category.value) {
    items = items.filter((w) => w.category === category.value)
  }
  return sortItems(items)
})

const filteredSkills = computed(() => {
  let items = [...skills.value]
  const q = query.value.toLowerCase().trim()
  if (q) {
    items = items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }
  if (category.value) {
    items = items.filter((s) => s.category === category.value)
  }
  return sortItems(items)
})

const pluginCategories = computed(() => [
  ...new Set(plugins.value.map((p) => p.category)),
])
const widgetCategories = computed(() => [
  ...new Set(widgets.value.map((w) => w.category)),
])
const skillCategories = computed(() => [
  ...new Set(skills.value.map((s) => s.category)),
])
const resultCount = computed(() => {
  if (activeTab.value === 'plugins') return filteredPlugins.value.length
  if (activeTab.value === 'themes') return filteredThemes.value.length
  if (activeTab.value === 'skills') return filteredSkills.value.length
  return filteredWidgets.value.length
})

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

// Leave home tab automatically when the user starts searching
watch(query, (v) => {
  if (v.trim() && activeTab.value === 'home') activeTab.value = 'plugins'
})

function findPlugin(id: string) {
  return computed(() => plugins.value.find((p) => p.id === id) ?? null)
}

function findTheme(id: string) {
  return computed(() => themes.value.find((t) => t.id === id) ?? null)
}

function findWidget(id: string) {
  return computed(() => widgets.value.find((w) => w.id === id) ?? null)
}

function findSkill(id: string) {
  return computed(() => skills.value.find((s) => s.id === id) ?? null)
}

export function useStore() {
  if (!loaded.value && !error.value) load()
  return {
    plugins,
    themes,
    widgets,
    skills,
    loaded,
    error,
    activeTab,
    query,
    category,
    sort,
    misskeyHost,
    filteredPlugins,
    filteredThemes,
    filteredWidgets,
    filteredSkills,
    pluginCategories,
    widgetCategories,
    skillCategories,
    resultCount,
    buildInstallUrl,
    findPlugin,
    findTheme,
    findWidget,
    findSkill,
  }
}
