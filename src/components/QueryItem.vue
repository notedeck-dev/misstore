<script setup lang="ts">
import type { QueryEntry } from '@/types'
import { QUERY_CATEGORY_LABELS } from '@/types'
import CopyButton from '@/components/CopyButton.vue'
import { useI18n } from '@/i18n'

// prop 名 query は useStore の検索クエリと紛らわしいため entry
defineProps<{ entry: QueryEntry }>()
const { localePath, itemText } = useI18n()
</script>

<template>
  <router-link :to="localePath(`/queries/${entry.id}`)" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-icon-plain" style="color: var(--accent-text)">
        <span
          v-if="entry.iconUrl"
          class="vsx-icon-img"
          :style="{ '--icon-url': `url(${entry.iconUrl})` }"
          role="img"
          :aria-label="itemText(entry).name"
        ></span>
        <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
      </div>
      <div class="vsx-details">
        <div class="vsx-name">{{ itemText(entry).name }}</div>
        <div class="vsx-author vsx-author-stack">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ entry.author }}
        </div>
        <p class="vsx-desc">{{ itemText(entry).description }}</p>
      </div>
    </div>
    <div class="vsx-footer">
      <span class="vsx-category">{{ QUERY_CATEGORY_LABELS[entry.category] || entry.category }}</span>
      <div class="vsx-actions">
        <CopyButton :source-url="entry.sourceUrl" :id="entry.id" />
      </div>
    </div>
  </router-link>
</template>
