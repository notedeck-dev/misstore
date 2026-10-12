<script setup lang="ts">
import { computed } from 'vue'
import StoreHeader from '@/components/StoreHeader.vue'
import StoreFooter from '@/components/StoreFooter.vue'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import WidgetItem from '@/components/WidgetItem.vue'
import SkillItem from '@/components/SkillItem.vue'
import QueryItem from '@/components/QueryItem.vue'
import StoreEmpty from '@/components/StoreEmpty.vue'
import StoreSkeleton from '@/components/StoreSkeleton.vue'
import HomeEntrance from '@/components/HomeEntrance.vue'
import {
  PLUGIN_CATEGORY_LABELS,
  QUERY_CATEGORY_LABELS,
  SKILL_CATEGORY_LABELS,
  WIDGET_CATEGORY_LABELS,
} from '@/types'
import { useStore } from '@/composables/useStore'

import { useI18n } from '@/i18n'

const {
  activeTab, category, sort, query, misskeyHost,
  onlyMisskeyWeb, onlyStandardProfile,
  filteredPlugins, filteredThemes, filteredWidgets, filteredSkills, filteredQueries,
  loaded, pluginCategories, widgetCategories, skillCategories, queryCategories, resultCount,
  plugins, themes, widgets, skills, queries,
} = useStore()
const { t } = useI18n()

// VS Marketplace の検索ページ見出し。種別名は UI 共通の英語ラベル
const KIND_LABELS = {
  themes: 'Themes',
  plugins: 'Plugins',
  widgets: 'Widgets',
  queries: 'Queries',
  skills: 'Skills',
} as const

const kind = computed(() => (activeTab.value === 'home' ? 'themes' : activeTab.value))
const kindLabel = computed(() => KIND_LABELS[kind.value])
const kindBlurb = computed(() => t.value.home.kinds[kind.value])
const kindTotal = computed(() => ({
  themes: themes.value.length,
  plugins: plugins.value.length,
  widgets: widgets.value.length,
  queries: queries.value.length,
  skills: skills.value.length,
})[kind.value])
</script>

<template>
  <StoreHeader />

  <HomeEntrance v-if="activeTab === 'home'" />

  <template v-else>
    <!-- VS Marketplace の検索ページ: 見出し + 検索 + 絞り込み -->
    <header class="catalog-head">
      <h1 class="catalog-title">
        {{ kindLabel }}
        <span v-if="loaded" class="chip">{{ kindTotal }}</span>
      </h1>
      <p class="catalog-blurb">{{ kindBlurb }}</p>
      <div class="catalog-tools">
        <label class="catalog-search">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="query"
            type="search"
            class="catalog-search-input"
            :placeholder="t.catalog.searchIn(kindLabel)"
          />
        </label>
        <label class="catalog-server" :title="t.catalog.serverHint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>
          {{ t.catalog.server }}
          <input
            id="misskey-host"
            v-model="misskeyHost"
            type="text"
            class="catalog-server-input"
            placeholder="example.com"
          />
        </label>
      </div>
    </header>

    <div class="store-filters">
      <div class="filter-pills">
        <button class="pill" :class="{ active: !category }" @click="category = ''">All</button>
        <template v-if="activeTab === 'plugins'">
          <button
            v-for="c in pluginCategories"
            :key="c"
            class="pill"
            :class="{ active: category === c }"
            @click="category = c"
          >
            {{ PLUGIN_CATEGORY_LABELS[c] || c }}
          </button>
        </template>
        <template v-else-if="activeTab === 'themes'">
          <button class="pill" :class="{ active: category === 'dark' }" @click="category = 'dark'">Dark</button>
          <button class="pill" :class="{ active: category === 'light' }" @click="category = 'light'">Light</button>
        </template>
        <template v-else-if="activeTab === 'skills'">
          <button
            v-for="c in skillCategories"
            :key="c"
            class="pill"
            :class="{ active: category === c }"
            @click="category = c"
          >
            {{ SKILL_CATEGORY_LABELS[c] || c }}
          </button>
        </template>
        <template v-else-if="activeTab === 'queries'">
          <button
            v-for="c in queryCategories"
            :key="c"
            class="pill"
            :class="{ active: category === c }"
            @click="category = c"
          >
            {{ QUERY_CATEGORY_LABELS[c] || c }}
          </button>
        </template>
        <template v-else>
          <button
            v-for="c in widgetCategories"
            :key="c"
            class="pill"
            :class="{ active: category === c }"
            @click="category = c"
          >
            {{ WIDGET_CATEGORY_LABELS[c] || c }}
          </button>
        </template>
      </div>
      <!-- 互換性トグル (contract 由来)。カテゴリ・検索・並び順と併用できる -->
      <div
        v-if="activeTab === 'plugins' || activeTab === 'widgets' || activeTab === 'skills'"
        class="filter-toggles"
      >
        <button
          v-if="activeTab === 'plugins'"
          type="button"
          class="pill pill-toggle"
          :class="{ active: onlyMisskeyWeb }"
          :aria-pressed="onlyMisskeyWeb"
          @click="onlyMisskeyWeb = !onlyMisskeyWeb"
        >
          <svg v-if="onlyMisskeyWeb" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ t.contract.filterMisskeyWeb }}
        </button>
        <button
          type="button"
          class="pill pill-toggle"
          :class="{ active: onlyStandardProfile }"
          :aria-pressed="onlyStandardProfile"
          @click="onlyStandardProfile = !onlyStandardProfile"
        >
          <svg v-if="onlyStandardProfile" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ t.contract.filterStandard }}
        </button>
      </div>
      <div class="filter-right">
        <span class="result-count">{{ t.catalog.results(resultCount) }}</span>
        <label class="filter-label" for="catalog-sort">{{ t.catalog.sortBy }}</label>
        <select id="catalog-sort" v-model="sort" class="sort-select">
          <option value="name">Name</option>
          <option value="newest">Recent</option>
        </select>
      </div>
    </div>

    <main class="store-body">
      <template v-if="loaded">
        <template v-if="activeTab === 'plugins'">
          <div v-if="filteredPlugins.length" class="store-grid">
            <PluginItem v-for="p in filteredPlugins" :key="p.id" :plugin="p" />
          </div>
          <StoreEmpty v-else />
        </template>
        <template v-else-if="activeTab === 'themes'">
          <div v-if="filteredThemes.length" class="store-grid">
            <ThemeItem v-for="t in filteredThemes" :key="t.id" :theme="t" />
          </div>
          <StoreEmpty v-else />
        </template>
        <template v-else-if="activeTab === 'skills'">
          <div v-if="filteredSkills.length" class="store-grid">
            <SkillItem v-for="s in filteredSkills" :key="s.id" :skill="s" />
          </div>
          <StoreEmpty v-else />
        </template>
        <template v-else-if="activeTab === 'queries'">
          <div v-if="filteredQueries.length" class="store-grid">
            <QueryItem v-for="s in filteredQueries" :key="s.id" :entry="s" />
          </div>
          <StoreEmpty v-else />
        </template>
        <template v-else>
          <div v-if="filteredWidgets.length" class="store-grid">
            <WidgetItem v-for="w in filteredWidgets" :key="w.id" :widget="w" />
          </div>
          <StoreEmpty v-else />
        </template>
      </template>
      <StoreSkeleton v-else />
    </main>
  </template>
  <StoreFooter />
</template>
