<script setup lang="ts">
import { useStore } from '@/composables/useStore'

const { error } = useStore()
</script>

<template>
  <div class="store-empty">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
    <div v-if="error" class="empty-text">Failed to load data</div>
    <template v-else>
      <div class="empty-text">No extensions found</div>
      <div class="empty-sub">Try a different search term</div>
    </template>
  </div>
</template>
