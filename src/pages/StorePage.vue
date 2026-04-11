<script setup lang="ts">
import StoreHeader from '@/components/StoreHeader.vue'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import StoreEmpty from '@/components/StoreEmpty.vue'
import { PLUGIN_CATEGORY_LABELS } from '@/types'
import { useStore } from '@/composables/useStore'

const {
  activeTab, category, sort, misskeyHost,
  filteredPlugins, filteredThemes,
  loaded, pluginCategories, resultCount,
} = useStore()
</script>

<template>
  <StoreHeader />

  <div class="server-bar">
    <label class="server-label" for="misskey-host">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>
      Server
    </label>
    <input
      id="misskey-host"
      v-model="misskeyHost"
      type="text"
      class="server-input"
      placeholder="example.com"
    />
  </div>

  <div class="store-filters">
    <div class="filter-pills">
      <button class="pill" :class="{ active: !category }" @click="category = ''">All</button>
      <template v-if="activeTab === 'plugins'">
        <button
          v-for="c in pluginCategories"
          :key="c"
          class="pill"
          :class="{ active: category === c }"
          @click="category = c"
        >
          {{ PLUGIN_CATEGORY_LABELS[c] || c }}
        </button>
      </template>
      <template v-else>
        <button class="pill" :class="{ active: category === 'dark' }" @click="category = 'dark'">Dark</button>
        <button class="pill" :class="{ active: category === 'light' }" @click="category = 'light'">Light</button>
      </template>
    </div>
    <div class="filter-right">
      <span class="result-count">{{ resultCount }} results</span>
      <select v-model="sort" class="sort-select">
        <option value="name">Name</option>
        <option value="newest">Recent</option>
      </select>
    </div>
  </div>

  <main class="store-body">
    <template v-if="loaded">
      <template v-if="activeTab === 'plugins'">
        <div v-if="filteredPlugins.length" class="store-grid">
          <PluginItem v-for="p in filteredPlugins" :key="p.id" :plugin="p" />
        </div>
        <StoreEmpty v-else />
      </template>
      <template v-else>
        <div v-if="filteredThemes.length" class="store-grid">
          <ThemeItem v-for="t in filteredThemes" :key="t.id" :theme="t" />
        </div>
        <StoreEmpty v-else />
      </template>
    </template>
    <div v-else class="store-loading">Loading...</div>
  </main>
</template>
