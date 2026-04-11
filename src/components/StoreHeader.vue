<script setup lang="ts">
import { useStore } from '@/composables/useStore'

const { activeTab, query } = useStore()
</script>

<template>
  <header class="store-header">
    <div class="header-inner">
      <a href="/" class="header-brand">
        <img
          src="https://raw.githubusercontent.com/hitalin/notedeck/main/src-tauri/icons/32x32.png"
          alt=""
          width="28"
          height="28"
        />
        <span class="brand-text">mis<b>store</b></span>
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
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search extensions..."
          class="search-input"
        />
      </div>
    </div>
  </header>
</template>
