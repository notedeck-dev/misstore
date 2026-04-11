<script setup lang="ts">
import { PLUGIN_CATEGORY_LABELS, type PluginEntry } from '@/types'
import { useCopySource } from '@/composables/useCopySource'

const props = defineProps<{ plugin: PluginEntry }>()
const { copiedId, copy } = useCopySource()

const initial = props.plugin.name[0]?.toUpperCase() ?? '?'
</script>

<template>
  <div class="store-card">
    <div class="card-header">
      <div class="card-icon">{{ initial }}</div>
      <div class="card-info">
        <div class="card-name">
          {{ plugin.name }}
          <span class="card-version">v{{ plugin.version }}</span>
        </div>
        <div class="card-author">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ plugin.author }}
        </div>
      </div>
    </div>
    <p class="card-desc">{{ plugin.description }}</p>
    <div class="card-meta">
      <span class="card-category">{{ PLUGIN_CATEGORY_LABELS[plugin.category] || plugin.category }}</span>
      <span v-for="tag in plugin.tags" :key="tag" class="card-tag">{{ tag }}</span>
    </div>
    <div class="card-footer">
      <button
        class="install-btn"
        :class="{ copied: copiedId === plugin.id }"
        @click="copy(plugin.sourceUrl, plugin.id)"
      >
        <svg v-if="copiedId !== plugin.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {{ copiedId === plugin.id ? 'Copied!' : 'Install' }}
      </button>
    </div>
  </div>
</template>
