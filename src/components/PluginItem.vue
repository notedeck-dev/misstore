<script setup lang="ts">
import type { PluginEntry } from '@/types'
import CopyButton from '@/components/CopyButton.vue'
import InstallButton from '@/components/InstallButton.vue'

defineProps<{ plugin: PluginEntry }>()
</script>

<template>
  <router-link :to="`/plugins/${plugin.id}`" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-icon-plain" :style="plugin.iconUrl ? 'color: var(--accent-text)' : null">
        <span
          v-if="plugin.iconUrl"
          class="vsx-icon-img"
          :style="{ '--icon-url': `url(${plugin.iconUrl})` }"
          role="img"
          :aria-label="plugin.name"
        ></span>
        <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
      </div>
      <div class="vsx-details">
        <div class="vsx-name">{{ plugin.name }}</div>
        <div class="vsx-author vsx-author-stack">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ plugin.author }}
        </div>
        <p class="vsx-desc">{{ plugin.description }}</p>
      </div>
    </div>
    <div class="vsx-footer">
      <div class="vsx-actions">
        <CopyButton :source-url="plugin.sourceUrl" :id="plugin.id" />
        <InstallButton :api-url="plugin.apiUrl" :sha512="plugin.sha512" />
      </div>
    </div>
  </router-link>
</template>
