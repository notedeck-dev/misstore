<script setup lang="ts">
import { useRoute } from 'vue-router'
import { CAPABILITY_LABELS, PLUGIN_CATEGORY_LABELS } from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { formatDate } from '@/utils/format'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import StoreFooter from '@/components/StoreFooter.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import IntegrityCard from '@/components/IntegrityCard.vue'
import PermissionsCard from '@/components/PermissionsCard.vue'

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
            <div class="detail-icon" :style="plugin.iconUrl ? 'color: var(--accent-text)' : null">
              <span
                v-if="plugin.iconUrl"
                class="detail-icon-img"
                :style="{ '--icon-url': `url(${plugin.iconUrl})` }"
                role="img"
                :aria-label="plugin.name"
              ></span>
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
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
            <CodeBlock
              :source="plugin.sourceUrl"
              lang="js"
              :filename="`${plugin.id}.is`"
            />
          </section>
        </div>

        <div class="detail-side">
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

            <div class="detail-more-info">
              <h3 class="detail-more-info-title">More Info</h3>
              <div class="detail-more-info-row">
                <span>Released</span>
                <span>{{ formatDate(plugin.createdAt) }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Last Updated</span>
                <span>{{ formatDate(plugin.updatedAt) }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Version</span>
                <span>v{{ plugin.version }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Identifier</span>
                <span>{{ plugin.id }}</span>
              </div>
            </div>
          </aside>

          <PermissionsCard
            title="Requires"
            :items="(plugin.capabilities || []).map((c) => CAPABILITY_LABELS[c] || c)"
            empty-text="Standalone — 外部サービス連携なしで動作します"
          />

          <PermissionsCard
            title="Permissions"
            :items="plugin.permissions || []"
            empty-text="追加の権限要求はありません"
          />

          <IntegrityCard :sha512="plugin.sha512" />
        </div>
      </div>
    </template>
  </main>
  <StoreFooter />
</template>
