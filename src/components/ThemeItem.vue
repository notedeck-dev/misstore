<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeEntry } from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { useStore } from '@/composables/useStore'
import ThemePreview from '@/components/ThemePreview.vue'

const props = defineProps<{ theme: ThemeEntry }>()
const { copiedId, copy } = useCopySource()
const { buildInstallUrl } = useStore()

const misskeyTheme = computed(() => ({
  id: props.theme.id,
  name: props.theme.name,
  base: props.theme.base,
  props: props.theme.themeProps,
}))

function openMisskeyInstall() {
  const url = buildInstallUrl(props.theme.apiUrl, props.theme.sha512)
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <div class="store-card">
    <div class="theme-preview-wrap">
      <ThemePreview :theme="misskeyTheme" />
    </div>
    <div class="card-header">
      <div class="card-info">
        <div class="card-name">
          {{ theme.name }}
          <span class="card-version">v{{ theme.version }}</span>
        </div>
        <div class="card-author">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ theme.author }}
        </div>
      </div>
    </div>
    <p class="card-desc">{{ theme.description }}</p>
    <div class="card-meta">
      <span class="card-tag">{{ theme.base }}</span>
      <span v-for="tag in theme.tags.filter(t => t !== 'dark' && t !== 'light')" :key="tag" class="card-tag">{{ tag }}</span>
    </div>
    <div class="card-footer">
      <button
        class="install-btn"
        :class="{ copied: copiedId === theme.id }"
        @click="copy(theme.sourceUrl, theme.id)"
      >
        <svg v-if="copiedId !== theme.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {{ copiedId === theme.id ? 'Copied!' : 'Copy' }}
      </button>
      <button
        class="install-btn misskey-install-btn"
        :disabled="!buildInstallUrl(theme.apiUrl, theme.sha512)"
        :title="buildInstallUrl(theme.apiUrl, theme.sha512) ? 'Misskey にインストール' : 'Server 欄にホスト名を入力してください'"
        @click="openMisskeyInstall"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Install
      </button>
    </div>
  </div>
</template>
