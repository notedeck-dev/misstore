<script setup lang="ts">
import { useRoute } from 'vue-router'
import { PLUGIN_CATEGORY_LABELS } from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import CodeBlock from '@/components/CodeBlock.vue'

const route = useRoute()
const { loaded, findPlugin, buildInstallUrl, misskeyHost } = useStore()
const { copiedId, copy } = useCopySource()

const plugin = findPlugin(route.params.id as string)

function openMisskeyInstall() {
  if (!plugin.value) return
  const url = buildInstallUrl(plugin.value.apiUrl, plugin.value.sha512)
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <StoreHeader />

  <main class="detail-body">
    <div v-if="!loaded" class="store-loading">Loading...</div>
    <div v-else-if="!plugin" class="store-empty">
      <p class="empty-text">Plugin not found</p>
      <router-link to="/" class="detail-back">Back to Store</router-link>
    </div>
    <template v-else>
      <div class="detail-breadcrumb">
        <router-link to="/" class="detail-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Store
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <span>{{ plugin.name }}</span>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-hero">
            <div class="detail-icon" :style="plugin.iconUrl ? 'color: var(--accent)' : null">
              <span
                v-if="plugin.iconUrl"
                class="detail-icon-img"
                :style="{ '--icon-url': `url(${plugin.iconUrl})` }"
                role="img"
                :aria-label="plugin.name"
              ></span>
              <template v-else>🧩</template>
            </div>
            <div class="detail-hero-info">
              <h1 class="detail-title">{{ plugin.name }}</h1>
              <div class="detail-meta-row">
                <span class="detail-version">v{{ plugin.version }}</span>
                <span class="detail-category">{{ PLUGIN_CATEGORY_LABELS[plugin.category] || plugin.category }}</span>
              </div>
              <p class="detail-description">{{ plugin.description }}</p>
              <div class="detail-actions">
                <button
                  class="vsx-btn"
                  :class="{ copied: copiedId === plugin.id }"
                  @click="copy(plugin.sourceUrl, plugin.id)"
                >
                  <svg v-if="copiedId !== plugin.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ copiedId === plugin.id ? 'Copied!' : 'Copy Source URL' }}
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
                    :disabled="!buildInstallUrl(plugin.apiUrl, plugin.sha512)"
                    @click="openMisskeyInstall"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Install
                  </button>
                </div>
              </div>
            </div>
          </div>

          <section class="detail-section">
            <h2 class="detail-section-title">Source</h2>
            <CodeBlock
              :source="plugin.sourceUrl"
              lang="js"
              :filename="`${plugin.id}.is`"
            />
          </section>
        </div>

        <aside class="detail-sidebar">
          <dl class="detail-info-list">
            <div class="detail-info-item">
              <dt>Author</dt>
              <dd>
                <a v-if="plugin.authorUrl" :href="plugin.authorUrl" target="_blank" rel="noopener" class="detail-link">{{ plugin.author }}</a>
                <span v-else>{{ plugin.author }}</span>
              </dd>
            </div>
            <div v-if="plugin.license" class="detail-info-item">
              <dt>License</dt>
              <dd>{{ plugin.license }}</dd>
            </div>
            <div v-if="plugin.repository" class="detail-info-item">
              <dt>Repository</dt>
              <dd><a :href="plugin.repository" target="_blank" rel="noopener" class="detail-link">Source Code</a></dd>
            </div>
            <div v-if="plugin.tags.length" class="detail-info-item">
              <dt>Tags</dt>
              <dd class="detail-tags">
                <span v-for="tag in plugin.tags" :key="tag" class="detail-tag">{{ tag }}</span>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </main>
</template>
