<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeEntry } from '@/types'
import CopyButton from '@/components/CopyButton.vue'
import InstallButton from '@/components/InstallButton.vue'
import ThemePreview from '@/components/ThemePreview.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{ theme: ThemeEntry }>()

const misskeyTheme = computed(() => ({
  id: props.theme.id,
  name: props.theme.name,
  base: props.theme.base,
  props: props.theme.themeProps,
}))
const { localePath, itemText } = useI18n()
</script>

<template>
  <router-link :to="localePath(`/themes/${theme.id}`)" class="vsx-card vsx-card-link">
    <div class="vsx-body">
      <div class="vsx-theme-preview">
        <ThemePreview :theme="misskeyTheme" />
      </div>
      <div class="vsx-details">
        <div class="vsx-name">{{ itemText(theme).name }}</div>
        <div class="vsx-author vsx-author-stack">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ theme.author }}
        </div>
        <p class="vsx-desc">{{ itemText(theme).description }}</p>
      </div>
    </div>
    <div class="vsx-footer">
      <div class="vsx-actions">
        <CopyButton :source-url="theme.sourceUrl" :id="theme.id" />
        <InstallButton :api-url="theme.apiUrl" :sha512="theme.sha512" />
      </div>
    </div>
  </router-link>
</template>
