<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  SKILL_CATEGORY_LABELS,
  SKILL_MODE_LABELS,
  SKILL_SCOPE_LABELS,
} from '@/types'
import { useCopySource } from '@/composables/useCopySource'
import { useStore } from '@/composables/useStore'
import StoreHeader from '@/components/StoreHeader.vue'
import CodeBlock from '@/components/CodeBlock.vue'

const route = useRoute()
const { loaded, findSkill } = useStore()
const { copiedId, copy } = useCopySource()

const skill = findSkill(route.params.id as string)
</script>

<template>
  <StoreHeader />

  <main class="detail-body">
    <div v-if="!loaded" class="store-loading">Loading...</div>
    <div v-else-if="!skill" class="store-empty">
      <p class="empty-text">Skill not found</p>
      <router-link to="/" class="detail-back">Back to Store</router-link>
    </div>
    <template v-else>
      <div class="detail-breadcrumb">
        <router-link to="/" class="detail-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Store
        </router-link>
        <span class="breadcrumb-sep">/</span>
        <span>{{ skill.name }}</span>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-hero">
            <div class="detail-icon" style="color: var(--accent)">
              <span
                v-if="skill.iconUrl"
                class="detail-icon-img"
                :style="{ '--icon-url': `url(${skill.iconUrl})` }"
                role="img"
                :aria-label="skill.name"
              ></span>
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/></svg>
            </div>
            <div class="detail-hero-info">
              <h1 class="detail-title">{{ skill.name }}</h1>
              <div class="detail-meta-row">
                <span class="detail-version">v{{ skill.version }}</span>
                <span class="detail-category">{{ SKILL_CATEGORY_LABELS[skill.category] || skill.category }}</span>
              </div>
              <p class="detail-description">{{ skill.description }}</p>
              <div class="detail-actions">
                <button
                  class="vsx-btn"
                  :class="{ copied: copiedId === skill.id }"
                  @click="copy(skill.sourceUrl, skill.id)"
                >
                  <svg v-if="copiedId !== skill.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ copiedId === skill.id ? 'Copied!' : 'Copy Source URL' }}
                </button>
              </div>
            </div>
          </div>

          <section class="detail-section">
            <h2 class="detail-section-title">Source</h2>
            <CodeBlock
              :source="skill.sourceUrl"
              lang="markdown"
              :filename="`${skill.id}.md`"
            />
          </section>
        </div>

        <aside class="detail-sidebar">
          <dl class="detail-info-list">
            <div class="detail-info-item">
              <dt>Author</dt>
              <dd>
                <a v-if="skill.authorUrl" :href="skill.authorUrl" target="_blank" rel="noopener" class="detail-link">{{ skill.author }}</a>
                <span v-else>{{ skill.author }}</span>
              </dd>
            </div>
            <div v-if="skill.license" class="detail-info-item">
              <dt>License</dt>
              <dd>{{ skill.license }}</dd>
            </div>
            <div v-if="skill.repository" class="detail-info-item">
              <dt>Repository</dt>
              <dd><a :href="skill.repository" target="_blank" rel="noopener" class="detail-link">Source Code</a></dd>
            </div>
            <div class="detail-info-item">
              <dt>Mode</dt>
              <dd>{{ SKILL_MODE_LABELS[skill.mode] || skill.mode }}</dd>
            </div>
            <div class="detail-info-item">
              <dt>Scope</dt>
              <dd>{{ SKILL_SCOPE_LABELS[skill.scope] || skill.scope }}</dd>
            </div>
            <div v-if="skill.triggers.length" class="detail-info-item">
              <dt>Triggers</dt>
              <dd class="detail-tags">
                <span v-for="t in skill.triggers" :key="t" class="detail-tag">{{ t }}</span>
              </dd>
            </div>
            <div v-if="skill.builtIn" class="detail-info-item">
              <dt>Built-in</dt>
              <dd>Yes</dd>
            </div>
            <div v-if="skill.tags.length" class="detail-info-item">
              <dt>Tags</dt>
              <dd class="detail-tags">
                <span v-for="tag in skill.tags" :key="tag" class="detail-tag">{{ tag }}</span>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </main>
</template>
