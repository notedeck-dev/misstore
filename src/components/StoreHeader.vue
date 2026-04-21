<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@/composables/useStore'
import { useColorMode } from '@/composables/useColorMode'

const { activeTab, query } = useStore()
const { mode: colorMode, cycle: cycleColorMode } = useColorMode()
const mobileOpen = ref(false)

function switchTab(tab: 'plugins' | 'themes') {
  activeTab.value = tab
  mobileOpen.value = false
}

const colorModeLabels: Record<string, string> = {
  system: 'システム設定に追従',
  light: 'ライトモード',
  dark: 'ダークモード',
}
</script>

<template>
  <div class="nav-root" :class="{ 'nav-open': mobileOpen }">
    <div class="nav-main">
      <div class="nav-bg"></div>
      <nav class="nav-container">
        <button class="nav-menu-button" aria-label="メニュー" @click="mobileOpen = !mobileOpen">
          <svg class="nav-icon-menu" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <svg class="nav-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <a href="/" class="nav-brand">
          <img
            src="https://raw.githubusercontent.com/hitalin/notedeck/main/src-tauri/icons/32x32.png"
            alt=""
          />
          <b>mis<span>store</span></b>
        </a>
        <div class="nav-items">
          <a
            href="#plugins"
            :class="{ active: activeTab === 'plugins' }"
            @click.prevent="activeTab = 'plugins'"
          >
            Plugins
          </a>
          <a
            href="#themes"
            :class="{ active: activeTab === 'themes' }"
            @click.prevent="activeTab = 'themes'"
          >
            Themes
          </a>
          <a href="https://notedeck.hital.in" target="_blank" rel="noopener">NoteDeck</a>
        </div>
        <div class="nav-right">
          <div class="nav-search">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="query"
              type="text"
              placeholder="Search extensions..."
              class="search-input"
            />
          </div>
          <button
            class="nav-right-button"
            :aria-label="`カラーモード切り替え (${colorModeLabels[colorMode]})`"
            :title="colorModeLabels[colorMode]"
            @click="cycleColorMode"
          >
            <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            <svg class="icon-system" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
          <a
            href="https://github.com/hitalin/misstore"
            class="nav-right-button"
            aria-label="GitHub"
            target="_blank"
            rel="noopener"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
        </div>
        <div class="nav-sp-spacer"></div>
      </nav>
    </div>
    <div class="nav-mobile-drawer">
      <button
        class="nav-mobile-item"
        :class="{ active: activeTab === 'plugins' }"
        @click="switchTab('plugins')"
      >
        Plugins
      </button>
      <button
        class="nav-mobile-item"
        :class="{ active: activeTab === 'themes' }"
        @click="switchTab('themes')"
      >
        Themes
      </button>
      <a
        href="https://notedeck.hital.in"
        class="nav-mobile-item"
        target="_blank"
        rel="noopener"
        @click="mobileOpen = false"
      >
        NoteDeck
      </a>
      <div class="nav-mobile-search">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search extensions..."
          class="search-input"
        />
      </div>
      <button class="nav-mobile-item" @click="cycleColorMode">
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="icon-system" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        {{ colorModeLabels[colorMode] }}
      </button>
      <a
        href="https://github.com/hitalin/misstore"
        class="nav-mobile-item"
        target="_blank"
        rel="noopener"
        @click="mobileOpen = false"
      >
        GitHub
      </a>
    </div>
  </div>
</template>
