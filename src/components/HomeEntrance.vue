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

const {
  plugins, themes, widgets, skills, queries, loaded, activeTab, query,
  filteredPlugins, filteredThemes, filteredWidgets, filteredSkills, filteredQueries,
} = useStore()

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
    <!-- Search cut — replaces the rails while a query is active. -->
    <template v-if="searching && loaded">
      <div class="rail-head">
        <h2 class="rail-title">「{{ query.trim() }}」の検索結果</h2>
        <p class="rail-note">種別をまたいで {{ searchTotal }} 件。</p>
      </div>

      <StoreEmpty v-if="searchTotal === 0" />

      <section v-if="filteredThemes.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Themes <span class="rail-count">{{ filteredThemes.length }}</span></h3>
        </div>
        <div class="store-grid">
          <ThemeItem v-for="t in filteredThemes" :key="t.id" :theme="t" />
        </div>
      </section>

      <section v-if="filteredPlugins.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Plugins <span class="rail-count">{{ filteredPlugins.length }}</span></h3>
        </div>
        <div class="store-grid">
          <PluginItem v-for="p in filteredPlugins" :key="p.id" :plugin="p" />
        </div>
      </section>

      <section v-if="filteredWidgets.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Widgets <span class="rail-count">{{ filteredWidgets.length }}</span></h3>
        </div>
        <div class="store-grid">
          <WidgetItem v-for="w in filteredWidgets" :key="w.id" :widget="w" />
        </div>
      </section>

      <section v-if="filteredQueries.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Queries <span class="rail-count">{{ filteredQueries.length }}</span></h3>
        </div>
        <div class="store-grid">
          <QueryItem v-for="q in filteredQueries" :key="q.id" :entry="q" />
        </div>
      </section>

      <section v-if="filteredSkills.length" class="home-rail">
        <div class="rail-head">
          <h3 class="rail-subtitle">Skills <span class="rail-count">{{ filteredSkills.length }}</span></h3>
        </div>
        <div class="store-grid">
          <SkillItem v-for="s in filteredSkills" :key="s.id" :skill="s" />
        </div>
      </section>
    </template>

    <template v-else>
      <!-- Minimal head: a title, one sentence, nothing else. -->
      <header class="home-intro">
        <h1 class="home-lead">Extensions for Misskey &amp; NoteDeck</h1>
        <p class="home-sub">
          テーマからスキルまで。見つけて、読んで、そのままインストール。
        </p>
      </header>

      <template v-if="loaded">
        <section v-if="recentThemes.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title">Themes <span class="rail-count">{{ themes.length }}</span></h2>
            <button class="rail-more" type="button" @click="go('themes')">すべて見る</button>
          </div>
          <div class="store-grid">
            <ThemeItem v-for="t in recentThemes" :key="t.id" :theme="t" />
          </div>
        </section>

        <section v-if="recentPlugins.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title">Plugins <span class="rail-count">{{ plugins.length }}</span></h2>
            <button class="rail-more" type="button" @click="go('plugins')">すべて見る</button>
          </div>
          <div class="store-grid">
            <PluginItem v-for="p in recentPlugins" :key="p.id" :plugin="p" />
          </div>
        </section>

        <section v-if="recentWidgets.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title">Widgets <span class="rail-count">{{ widgets.length }}</span></h2>
            <button class="rail-more" type="button" @click="go('widgets')">すべて見る</button>
          </div>
          <div class="store-grid">
            <WidgetItem v-for="w in recentWidgets" :key="w.id" :widget="w" />
          </div>
        </section>

        <section v-if="recentQueries.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title">Queries <span class="rail-count">{{ queries.length }}</span></h2>
            <button class="rail-more" type="button" @click="go('queries')">すべて見る</button>
          </div>
          <div class="store-grid">
            <QueryItem v-for="q in recentQueries" :key="q.id" :entry="q" />
          </div>
        </section>

        <section v-if="recentSkills.length" class="home-rail home-rail-recent">
          <div class="rail-head rail-head-split">
            <h2 class="rail-title">Skills <span class="rail-count">{{ skills.length }}</span></h2>
            <button class="rail-more" type="button" @click="go('skills')">すべて見る</button>
          </div>
          <div class="store-grid">
            <SkillItem v-for="s in recentSkills" :key="s.id" :skill="s" />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
}

.home-intro {
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.home-lead {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text);
  overflow-wrap: anywhere;
}

.home-sub {
  margin-top: var(--space-sm);
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--text-sub);
}

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
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text);
}

.rail-count {
  margin-inline-start: var(--space-2xs);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--accent-text);
  font-variant-numeric: tabular-nums;
}

.rail-more {
  border: 0;
  background: none;
  padding: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 600;
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
  .home { padding: var(--space-lg) var(--space-md) var(--space-xl); }
  .home-rail { padding-top: var(--space-lg); }
}
</style>
