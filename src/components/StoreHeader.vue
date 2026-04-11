<script setup lang="ts">
import { PLUGIN_CATEGORY_LABELS } from '@/types'
import { useStore } from '@/composables/useStore'

const { activeTab, query, category, sort, pluginCategories, resultCount } = useStore()
</script>

<template>
  <header class="store-header">
    <div class="header-inner">
      <a href="/" class="header-brand">
        <img
          src="https://raw.githubusercontent.com/hitalin/notedeck/main/src-tauri/icons/32x32.png"
          alt=""
          width="24"
          height="24"
        />
        <span class="brand-text">Mis<b>Store</b></span>
      </a>

      <div class="header-tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'plugins' }"
          @click="activeTab = 'plugins'"
        >
          Plugins
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'themes' }"
          @click="activeTab = 'themes'"
        >
          Themes
        </button>
      </div>

      <div class="header-search">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search extensions..."
          class="search-input"
        />
      </div>

      <div class="header-filters">
        <span class="result-count">{{ resultCount }} results</span>
        <select v-model="category" class="filter-select">
          <option value="">All</option>
          <template v-if="activeTab === 'plugins'">
            <option v-for="c in pluginCategories" :key="c" :value="c">
              {{ PLUGIN_CATEGORY_LABELS[c] || c }}
            </option>
          </template>
          <template v-else>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </template>
        </select>
        <select v-model="sort" class="filter-select">
          <option value="name">Name</option>
          <option value="newest">Recent</option>
        </select>
      </div>
    </div>
  </header>
</template>

