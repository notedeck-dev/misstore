<script setup lang="ts">
import type { WidgetEntry } from '@/types'
import CopyButton from '@/components/CopyButton.vue'

defineProps<{ widget: WidgetEntry }>()
</script>

<template>
  <router-link :to="`/widgets/${widget.id}`" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-icon-plain" style="color: var(--accent-text)">
        <span
          v-if="widget.iconUrl"
          class="vsx-icon-img"
          :style="{ '--icon-url': `url(${widget.iconUrl})` }"
          role="img"
          :aria-label="widget.name"
        ></span>
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
        <CopyButton :source-url="widget.sourceUrl" :id="widget.id" />
      </div>
    </div>
  </router-link>
</template>
