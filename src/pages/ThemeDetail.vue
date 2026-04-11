<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCopySource } from '@/composables/useCopySource'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import ThemePreview from '@/components/ThemePreview.vue'

const route = useRoute()
const { loaded, findTheme, buildInstallUrl, misskeyHost } = useStore()
const { copiedId, copy } = useCopySource()

const theme = findTheme(route.params.id as string)

const misskeyTheme = computed(() => {
  if (!theme.value) return null
  return {
    id: theme.value.id,
    name: theme.value.name,
    base: theme.value.base,
    props: theme.value.themeProps,
  }
})

function openMisskeyInstall() {
  if (!theme.value) return
  const url = buildInstallUrl(theme.value.apiUrl, theme.value.sha512)
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <StoreHeader />

  <main class="detail-body">
    <div v-if="!loaded" class="store-loading">Loading...</div>
    <div v-else-if="!theme" class="store-empty">
      <p class="empty-text">Theme not found</p>
      <router-link to="/" class="detail-back">Back to Store</router-link>
    </div>
    <template v-else>
      <div class="detail-breadcrumb">
        <router-link to="/" class="detail-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Store
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <span>{{ theme.name }}</span>
      </div>

      <div class="detail-hero">
        <div class="detail-theme-preview-lg">
          <ThemePreview v-if="misskeyTheme" :theme="misskeyTheme" />
        </div>
        <div class="detail-hero-info">
          <h1 class="detail-title">{{ theme.name }}</h1>
          <div class="detail-meta-row">
            <span class="detail-version">v{{ theme.version }}</span>
            <span class="detail-category">{{ theme.base }}</span>
          </div>
          <p class="detail-description">{{ theme.description }}</p>
          <div class="detail-actions">
            <button
              class="vsx-btn"
              :class="{ copied: copiedId === theme.id }"
              @click="copy(theme.sourceUrl, theme.id)"
            >
              <svg v-if="copiedId !== theme.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ copiedId === theme.id ? 'Copied!' : 'Copy Source URL' }}
            </button>
            <div class="detail-install-group">
              <input
                v-model="misskeyHost"
                type="text"
                class="detail-host-input"
                placeholder="example.com"
              />
              <button
                class="vsx-btn vsx-btn-primary"
                :disabled="!buildInstallUrl(theme.apiUrl, theme.sha512)"
                @click="openMisskeyInstall"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Install
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-sidebar">
        <dl class="detail-info-list">
          <div class="detail-info-item">
            <dt>Author</dt>
            <dd>{{ theme.author }}</dd>
          </div>
          <div v-if="theme.tags.length" class="detail-info-item">
            <dt>Tags</dt>
            <dd class="detail-tags">
              <span v-for="tag in theme.tags" :key="tag" class="detail-tag">{{ tag }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </main>
</template>
