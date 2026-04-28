<script setup lang="ts">
import type { SkillEntry } from '@/types'
import { useCopySource } from '@/composables/useCopySource'

defineProps<{ skill: SkillEntry }>()
const { copiedId, copy } = useCopySource()
</script>

<template>
  <router-link :to="`/skills/${skill.id}`" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-icon-plain" style="color: var(--accent)">
        <span
          v-if="skill.iconUrl"
          class="vsx-icon-img"
          :style="{ '--icon-url': `url(${skill.iconUrl})` }"
          role="img"
          :aria-label="skill.name"
        ></span>
        <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/></svg>
      </div>
      <div class="vsx-details">
        <div class="vsx-name">{{ skill.name }}</div>
        <div class="vsx-author vsx-author-stack">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ skill.author }}
        </div>
        <p class="vsx-desc">{{ skill.description }}</p>
      </div>
    </div>
    <div class="vsx-footer">
      <div class="vsx-actions">
        <button
          class="vsx-btn"
          :class="{ copied: copiedId === skill.id }"
          @click.stop="copy(skill.sourceUrl, skill.id)"
        >
          <svg v-if="copiedId !== skill.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ copiedId === skill.id ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>
  </router-link>
</template>
