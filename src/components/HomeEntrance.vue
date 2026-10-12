<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import type { StoreTab } from '@/types'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import WidgetItem from '@/components/WidgetItem.vue'
import SkillItem from '@/components/SkillItem.vue'
import QueryItem from '@/components/QueryItem.vue'
import StoreEmpty from '@/components/StoreEmpty.vue'
import { useI18n } from '@/i18n'

const {
  plugins, themes, widgets, skills, queries, loaded, activeTab, query,
  filteredPlugins, filteredThemes, filteredWidgets, filteredSkills, filteredQueries,
} = useStore()
const { t } = useI18n()

type Kind = Exclude<StoreTab, 'home'>

// Search cut — typing in the nav box used to yank the visitor onto the Themes
// tab and search only themes; on home the query cuts across every kind instead.
const searching = computed(() => query.value.trim().length > 0)

const searchTotal = computed(() =>
  filteredThemes.value.length +
  filteredPlugins.value.length +
  filteredWidgets.value.length +
  filteredSkills.value.length +
  filteredQueries.value.length,
)

// Hub の「はじめる」4 枚に相当する種別の入口。並びはナビと同じ
const kinds = computed<{ tab: Kind; label: string; count: number; blurb: string }[]>(() => [
  { tab: 'themes', label: 'Themes', count: themes.value.length, blurb: t.value.home.kinds.themes },
  { tab: 'plugins', label: 'Plugins', count: plugins.value.length, blurb: t.value.home.kinds.plugins },
  { tab: 'widgets', label: 'Widgets', count: widgets.value.length, blurb: t.value.home.kinds.widgets },
  { tab: 'queries', label: 'Queries', count: queries.value.length, blurb: t.value.home.kinds.queries },
  { tab: 'skills', label: 'Skills', count: skills.value.length, blurb: t.value.home.kinds.skills },
])

// One newest rail per type — one grid row each on desktop.
const PER_KIND = 5

function newest<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, PER_KIND)
}

const recentThemes = computed(() => newest(themes.value))
const recentPlugins = computed(() => newest(plugins.value))
const recentWidgets = computed(() => newest(widgets.value))
const recentQueries = computed(() => newest(queries.value))
const recentSkills = computed(() => newest(skills.value))

function go(tab: Kind) {
  activeTab.value = tab
}
</script>

<template>
  <div class="home">
    <!-- Hub .section_top — 角丸の面にタグライン + 検索 + お知らせ pill -->
    <section class="home-hero" :class="{ 'is-searching': searching }">
      <div class="home-hero-card">
        <div class="home-hero-blob" aria-hidden="true"></div>
        <div class="home-hero-inner">
          <div class="home-hero-copy">
            <h1 class="home-tagline">Find.<br />Read.<br /><b class="text-gradient">Install.</b></h1>
            <div class="home-hero-sub">
              <span class="chip">{{ t.home.chip }}</span>
              <p>{{ t.home.sub }}</p>
            </div>
            <!-- VS Marketplace のヒーロー検索。種別をまたいで引く -->
            <label class="home-search">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                v-model="query"
                type="search"
                class="home-search-input"
                :placeholder="t.home.heroSearch"
              />
            </label>
            <a
              class="notice"
              href="https://github.com/notedeck-dev/misstore/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener"
            >
              <span class="notice-inner">
                <span class="notice-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>
                </span>
                <span>{{ t.home.notice }}</span>
                <svg class="notice-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </span>
            </a>
          </div>
          <!-- Hub の Mi3d の位置にアプリアイコン -->
          <div class="home-hero-visual" aria-hidden="true">
            <img
              src="https://raw.githubusercontent.com/notedeck-dev/notedeck/main/src-tauri/icons/128x128@2x.png"
              alt=""
              class="home-hero-icon"
              width="256"
              height="256"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Search cut — replaces the kind cards and rails while a query is active. -->
    <template v-if="searching && loaded">
      <div class="rail-head home-search-head">
        <h2 class="rail-title">{{ t.home.searchTitle(query.trim()) }}</h2>
        <p class="rail-note">{{ t.home.searchNote(searchTotal) }}</p>
      </div>

      <StoreEmpty v-if="searchTotal === 0" />

      <section v-if="filteredThemes.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Themes <span class="chip chip-sm">{{ filteredThemes.length }}</span></h3>
        </div>
        <div class="store-grid">
          <ThemeItem v-for="t in filteredThemes" :key="t.id" :theme="t" />
        </div>
      </section>

      <section v-if="filteredPlugins.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Plugins <span class="chip chip-sm">{{ filteredPlugins.length }}</span></h3>
        </div>
        <div class="store-grid">
          <PluginItem v-for="p in filteredPlugins" :key="p.id" :plugin="p" />
        </div>
      </section>

      <section v-if="filteredWidgets.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Widgets <span class="chip chip-sm">{{ filteredWidgets.length }}</span></h3>
        </div>
        <div class="store-grid">
          <WidgetItem v-for="w in filteredWidgets" :key="w.id" :widget="w" />
        </div>
      </section>

      <section v-if="filteredQueries.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Queries <span class="chip chip-sm">{{ filteredQueries.length }}</span></h3>
        </div>
        <div class="store-grid">
          <QueryItem v-for="q in filteredQueries" :key="q.id" :entry="q" />
        </div>
      </section>

      <section v-if="filteredSkills.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Skills <span class="chip chip-sm">{{ filteredSkills.length }}</span></h3>
        </div>
        <div class="store-grid">
          <SkillItem v-for="s in filteredSkills" :key="s.id" :skill="s" />
        </div>
      </section>
    </template>

    <template v-else>
      <!-- Hub .section_keyFeatures — ヒーローに食い込む acrylic カード列。ここでは種別の入口 -->
      <nav class="home-kinds" aria-label="Kinds">
        <a
          v-for="k in kinds"
          :key="k.tab"
          :href="`#${k.tab}`"
          class="home-kind acrylic punched"
          @click.prevent="go(k.tab)"
        >
          <span class="home-kind-icon" aria-hidden="true">
            <svg v-if="k.tab === 'themes'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
            <svg v-else-if="k.tab === 'plugins'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
            <svg v-else-if="k.tab === 'widgets'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <svg v-else-if="k.tab === 'queries'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <svg v-else width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/></svg>
          </span>
          <span class="home-kind-title">
            {{ k.label }}
            <span v-if="loaded" class="chip chip-sm">{{ k.count }}</span>
          </span>
          <span class="home-kind-blurb">{{ k.blurb }}</span>
          <span class="btn btn-accent btn-sm">
            {{ t.home.browse }}
            <svg class="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </a>
      </nav>

      <template v-if="loaded">
        <!-- VS Marketplace の "Recently Added" rail を種別ごとに -->
        <section v-if="recentThemes.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title"><span class="u-line">{{ t.home.latest }} Themes</span></h2>
            <button class="rail-more" type="button" @click="go('themes')">
              {{ t.home.seeAll }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="store-grid">
            <ThemeItem v-for="t in recentThemes" :key="t.id" :theme="t" />
          </div>
        </section>

        <section v-if="recentPlugins.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title"><span class="u-line">{{ t.home.latest }} Plugins</span></h2>
            <button class="rail-more" type="button" @click="go('plugins')">
              {{ t.home.seeAll }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="store-grid">
            <PluginItem v-for="p in recentPlugins" :key="p.id" :plugin="p" />
          </div>
        </section>

        <section v-if="recentWidgets.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title"><span class="u-line">{{ t.home.latest }} Widgets</span></h2>
            <button class="rail-more" type="button" @click="go('widgets')">
              {{ t.home.seeAll }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="store-grid">
            <WidgetItem v-for="w in recentWidgets" :key="w.id" :widget="w" />
          </div>
        </section>

        <section v-if="recentQueries.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title"><span class="u-line">{{ t.home.latest }} Queries</span></h2>
            <button class="rail-more" type="button" @click="go('queries')">
              {{ t.home.seeAll }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="store-grid">
            <QueryItem v-for="q in recentQueries" :key="q.id" :entry="q" />
          </div>
        </section>

        <section v-if="recentSkills.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title"><span class="u-line">{{ t.home.latest }} Skills</span></h2>
            <button class="rail-more" type="button" @click="go('skills')">
              {{ t.home.seeAll }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="store-grid">
            <SkillItem v-for="s in recentSkills" :key="s.id" :skill="s" />
          </div>
        </section>
      </template>

      <!-- Hub .section_free — dots の帯に面カード + 色付きサブ箱。投稿の入口 -->
      <section class="home-contribute dots-section">
        <div class="home-contribute-card">
          <div class="home-contribute-copy">
            <h2 class="home-contribute-title">{{ t.home.contribute.title }}</h2>
            <p class="home-contribute-body">{{ t.home.contribute.body }}</p>
            <div class="home-contribute-actions">
              <a
                class="btn btn-accent shadow"
                href="https://github.com/notedeck-dev/misstore/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener"
              >
                {{ t.home.contribute.guide }}
                <svg class="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </a>
              <a
                class="btn btn-plain"
                href="https://github.com/notedeck-dev/misstore/blob/main/docs/registry-format.md"
                target="_blank"
                rel="noopener"
              >
                {{ t.home.contribute.format }}
                <svg class="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </a>
            </div>
          </div>
          <div class="home-contribute-side" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            <b>notedeck-dev/misstore</b>
            <span>Pull Request → CI → Store</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--space-lg) var(--space-2xl);
}

.home-search-head { padding-top: var(--space-xl); }

.home-rail { padding-top: var(--space-xl); }

.rail-head { margin-bottom: var(--space-md); }

.rail-head-split {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
}

.rail-title {
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text);
}

.rail-note {
  margin-top: var(--space-3xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Search cut — per-kind group headings, one register below the rail title. */
.rail-subtitle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text);
}

/* VS Marketplace の "See more ›" */
.rail-more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  border: 0;
  background: none;
  padding: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--accent-text);
  cursor: pointer;
  white-space: nowrap;
  transition: opacity var(--duration-base) var(--ease-out);
}

.rail-more:hover { opacity: 0.7; }

/* Below 900px the grid is 4 or 2 columns — a 5th card sits alone on its own row,
 * so the newest rails drop it. Search results always show everything. */
@media (max-width: 900px) {
  .home-rail-recent .store-grid > :nth-child(5) { display: none; }
}

@media (max-width: 800px) {
  .home { padding: 0 var(--space-md) var(--space-xl); }
  .home-rail { padding-top: var(--space-lg); }
}
</style>
