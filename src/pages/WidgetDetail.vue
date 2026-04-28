<script setup lang="ts">
import { useRoute } from 'vue-router'
import { WIDGET_CAPABILITY_LABELS, WIDGET_CATEGORY_LABELS } from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import CodeBlock from '@/components/CodeBlock.vue'

const route = useRoute()
const { loaded, findWidget } = useStore()
const { copiedId, copy } = useCopySource()

const widget = findWidget(route.params.id as string)
</script>

<template>
  <StoreHeader />

  <main class="detail-body">
    <div v-if="!loaded" class="store-loading">Loading...</div>
    <div v-else-if="!widget" class="store-empty">
      <p class="empty-text">Widget not found</p>
      <router-link to="/" class="detail-back">Back to Store</router-link>
    </div>
    <template v-else>
      <div class="detail-breadcrumb">
        <router-link to="/" class="detail-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Store
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <span>{{ widget.name }}</span>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-hero">
            <div class="detail-icon" style="color: var(--accent)">
              <img v-if="widget.iconUrl" :src="widget.iconUrl" :alt="widget.name" class="detail-icon-img" />
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </div>
            <div class="detail-hero-info">
              <h1 class="detail-title">{{ widget.name }}</h1>
              <div class="detail-meta-row">
                <span class="detail-version">v{{ widget.version }}</span>
                <span class="detail-category">{{ WIDGET_CATEGORY_LABELS[widget.category] || widget.category }}</span>
              </div>
              <p class="detail-description">{{ widget.description }}</p>
              <div class="detail-actions">
                <button
                  class="vsx-btn"
                  :class="{ copied: copiedId === widget.id }"
                  @click="copy(widget.sourceUrl, widget.id)"
                >
                  <svg v-if="copiedId !== widget.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ copiedId === widget.id ? 'Copied!' : 'Copy Source URL' }}
                </button>
              </div>
            </div>
          </div>

          <section class="detail-section">
            <h2 class="detail-section-title">Source</h2>
            <CodeBlock
              :source="widget.sourceUrl"
              lang="js"
              :filename="`${widget.id}.is`"
            />
          </section>
        </div>

        <aside class="detail-sidebar">
          <dl class="detail-info-list">
            <div class="detail-info-item">
              <dt>Author</dt>
              <dd>
                <a v-if="widget.authorUrl" :href="widget.authorUrl" target="_blank" rel="noopener" class="detail-link">{{ widget.author }}</a>
                <span v-else>{{ widget.author }}</span>
              </dd>
            </div>
            <div v-if="widget.license" class="detail-info-item">
              <dt>License</dt>
              <dd>{{ widget.license }}</dd>
            </div>
            <div v-if="widget.repository" class="detail-info-item">
              <dt>Repository</dt>
              <dd><a :href="widget.repository" target="_blank" rel="noopener" class="detail-link">Source Code</a></dd>
            </div>
            <div class="detail-info-item">
              <dt>Auto Run</dt>
              <dd>{{ widget.autoRun ? 'Yes' : 'No' }}</dd>
            </div>
            <div class="detail-info-item">
              <dt>Requires</dt>
              <dd v-if="widget.capabilities.length" class="detail-tags">
                <span v-for="c in widget.capabilities" :key="c" class="detail-tag">{{ WIDGET_CAPABILITY_LABELS[c] || c }}</span>
              </dd>
              <dd v-else>Standalone</dd>
            </div>
            <div v-if="widget.tags.length" class="detail-info-item">
              <dt>Tags</dt>
              <dd class="detail-tags">
                <span v-for="tag in widget.tags" :key="tag" class="detail-tag">{{ tag }}</span>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </main>
</template>
