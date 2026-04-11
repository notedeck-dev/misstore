<script setup lang="ts">
import type { ThemeEntry } from '@/types'
import { useCopySource } from '@/composables/useCopySource'

const props = defineProps<{ theme: ThemeEntry }>()
const { copiedId, copy } = useCopySource()

const colors = props.theme.previewColors
</script>

<template>
  <div class="store-item">
    <div class="item-icon theme-icon">
      <div class="theme-cell" :style="{ background: colors.bg }" />
      <div class="theme-cell" :style="{ background: colors.accent }" />
      <div class="theme-cell" :style="{ background: colors.panel }" />
      <div class="theme-cell" :style="{ background: colors.fg }" />
    </div>
    <div class="item-body">
      <div class="item-title">
        <span class="item-name">{{ theme.name }}</span>
        <span class="item-version">v{{ theme.version }}</span>
      </div>
      <div class="item-desc">{{ theme.description }}</div>
      <div class="item-meta">
        <span class="item-author">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ theme.author }}
        </span>
        <span class="item-tag">{{ theme.base }}</span>
        <span v-for="tag in theme.tags.filter(t => t !== 'dark' && t !== 'light')" :key="tag" class="item-tag">
          {{ tag }}
        </span>
      </div>
      <div class="palette-bar">
        <div class="palette-seg" :style="{ background: colors.bg }" />
        <div class="palette-seg" :style="{ background: colors.panel }" />
        <div class="palette-seg" :style="{ background: colors.accent }" />
        <div class="palette-seg" :style="{ background: colors.fg }" />
      </div>
    </div>
    <div class="item-actions">
      <button
        class="install-btn"
        :class="{ copied: copiedId === theme.id }"
        @click="copy(theme.sourceUrl, theme.id)"
      >
        <svg v-if="copiedId !== theme.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {{ copiedId === theme.id ? 'Copied!' : 'Install' }}
      </button>
    </div>
  </div>
</template>
