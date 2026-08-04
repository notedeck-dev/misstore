<script setup lang="ts">
import { useRoute } from 'vue-router'
import { QUERY_CATEGORY_LABELS } from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { formatDate } from '@/utils/format'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import StoreFooter from '@/components/StoreFooter.vue'
import CodeBlock from '@/components/CodeBlock.vue'
import IntegrityCard from '@/components/IntegrityCard.vue'

const route = useRoute()
const { loaded, findQuery } = useStore()
const { copiedId, copy } = useCopySource()

const entry = findQuery(route.params.id as string)
</script>

<template>
  <StoreHeader />

  <main class="detail-body">
    <div v-if="!loaded" class="store-loading">Loading...</div>
    <div v-else-if="!entry" class="store-empty">
      <p class="empty-text">Query not found</p>
      <router-link to="/" class="detail-back">Back to Store</router-link>
    </div>
    <template v-else>
      <div class="detail-breadcrumb">
        <router-link to="/" class="detail-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Store
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <span>{{ entry.name }}</span>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-hero">
            <div class="detail-icon" style="color: var(--accent-text)">
              <span
                v-if="entry.iconUrl"
                class="detail-icon-img"
                :style="{ '--icon-url': `url(${entry.iconUrl})` }"
                role="img"
                :aria-label="entry.name"
              ></span>
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </div>
            <div class="detail-hero-info">
              <h1 class="detail-title">{{ entry.name }}</h1>
              <div class="detail-meta-row">
                <span class="detail-version">v{{ entry.version }}</span>
                <span class="detail-category">{{ QUERY_CATEGORY_LABELS[entry.category] || entry.category }}</span>
              </div>
              <p class="detail-description">{{ entry.description }}</p>
              <p class="detail-description">
                NoteDeck のカラム設定に貼り付けて使う AiScript フィルタクエリです。式が
                <code>true</code> を返したノートだけが表示されます。
              </p>
              <div class="detail-actions">
                <button
                  class="vsx-btn"
                  :class="{ copied: copiedId === entry.id }"
                  @click="copy(entry.sourceUrl, entry.id)"
                >
                  <svg v-if="copiedId !== entry.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ copiedId === entry.id ? 'Copied!' : 'Copy Query' }}
                </button>
              </div>
            </div>
          </div>

          <section class="detail-section">
            <CodeBlock
              :source="entry.sourceUrl"
              lang="js"
              :filename="`${entry.id}.is`"
            />
          </section>
        </div>

        <div class="detail-side">
          <aside class="detail-sidebar">
            <dl class="detail-info-list">
              <div class="detail-info-item">
                <dt>Author</dt>
                <dd>
                  <a v-if="entry.authorUrl" :href="entry.authorUrl" target="_blank" rel="noopener" class="detail-link">{{ entry.author }}</a>
                  <span v-else>{{ entry.author }}</span>
                </dd>
              </div>
              <div v-if="entry.license" class="detail-info-item">
                <dt>License</dt>
                <dd>{{ entry.license }}</dd>
              </div>
              <div v-if="entry.repository" class="detail-info-item">
                <dt>Repository</dt>
                <dd><a :href="entry.repository" target="_blank" rel="noopener" class="detail-link">Source Code</a></dd>
              </div>
              <div class="detail-info-item">
                <dt>Category</dt>
                <dd>{{ QUERY_CATEGORY_LABELS[entry.category] || entry.category }}</dd>
              </div>
              <div v-if="entry.tags.length" class="detail-info-item">
                <dt>Tags</dt>
                <dd class="detail-tags">
                  <span v-for="tag in entry.tags" :key="tag" class="detail-tag">{{ tag }}</span>
                </dd>
              </div>
            </dl>

            <div class="detail-more-info">
              <h3 class="detail-more-info-title">More Info</h3>
              <div class="detail-more-info-row">
                <span>Released</span>
                <span>{{ formatDate(entry.createdAt) }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Last Updated</span>
                <span>{{ formatDate(entry.updatedAt) }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Version</span>
                <span>v{{ entry.version }}</span>
              </div>
              <div class="detail-more-info-row">
                <span>Identifier</span>
                <span>{{ entry.id }}</span>
              </div>
            </div>
          </aside>

          <IntegrityCard :sha512="entry.sha512" />
        </div>
      </div>
    </template>
  </main>
  <StoreFooter />
</template>
