<script setup lang="ts">
import type { WidgetEntry } from '@/types'
import { useCopySource } from '@/composables/useCopySource'

defineProps<{ widget: WidgetEntry }>()
const { copiedId, copy } = useCopySource()
</script>

<template>
  <router-link :to="`/widgets/${widget.id}`" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-icon-plain" style="color: var(--accent)">
        <img v-if="widget.iconUrl" :src="widget.iconUrl" :alt="widget.name" class="vsx-icon-img" />
        <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
      </div>
      <div class="vsx-details">
        <div class="vsx-name">{{ widget.name }}</div>
        <div class="vsx-author vsx-author-stack">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ widget.author }}
        </div>
        <p class="vsx-desc">{{ widget.description }}</p>
      </div>
    </div>
    <div class="vsx-footer">
      <div class="vsx-actions">
        <button
          class="vsx-btn"
          :class="{ copied: copiedId === widget.id }"
          @click.stop="copy(widget.sourceUrl, widget.id)"
        >
          <svg v-if="copiedId !== widget.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ copiedId === widget.id ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>
  </router-link>
</template>
