<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import type {
  PluginEntry,
  QueryEntry,
  SkillEntry,
  StoreTab,
  ThemeEntry,
  WidgetEntry,
} from '@/types'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import WidgetItem from '@/components/WidgetItem.vue'
import SkillItem from '@/components/SkillItem.vue'
import QueryItem from '@/components/QueryItem.vue'

const { plugins, themes, widgets, skills, queries, loaded, activeTab, query } = useStore()

type Kind = Exclude<StoreTab, 'home'>

// Surface 1 — the type index. Counts are real; nothing here is curated or ranked.
const kinds = computed(() => [
  { kind: 'themes' as Kind, label: 'Themes', count: themes.value.length, blurb: '配色を丸ごと入れ替える Misskey 互換テーマ' },
  { kind: 'plugins' as Kind, label: 'Plugins', count: plugins.value.length, blurb: 'タイムラインや投稿を拡張する AiScript プラグイン' },
  { kind: 'widgets' as Kind, label: 'Widgets', count: widgets.value.length, blurb: 'NoteDeck のカラムに置ける AiScript ウィジェット' },
  { kind: 'queries' as Kind, label: 'Queries', count: queries.value.length, blurb: 'カラムを絞り込むフィルタクエリ' },
  { kind: 'skills' as Kind, label: 'Skills', count: skills.value.length, blurb: 'NoteDeck の AI に持たせるシステムプロンプト' },
])

// Surface 2 — one mixed rail across every type, newest first. The point is the
// collision: a query lands next to a theme next to a skill, so you meet kinds of
// extension you weren't looking for.
type MixedEntry =
  | { kind: 'themes'; label: string; key: string; createdAt: string; item: ThemeEntry }
  | { kind: 'plugins'; label: string; key: string; createdAt: string; item: PluginEntry }
  | { kind: 'widgets'; label: string; key: string; createdAt: string; item: WidgetEntry }
  | { kind: 'skills'; label: string; key: string; createdAt: string; item: SkillEntry }
  | { kind: 'queries'; label: string; key: string; createdAt: string; item: QueryEntry }

const MIXED_COUNT = 10

const recentMixed = computed<MixedEntry[]>(() => {
  const all: MixedEntry[] = [
    ...themes.value.map((item): MixedEntry => ({ kind: 'themes', label: 'Theme', key: `themes/${item.id}`, createdAt: item.createdAt, item })),
    ...plugins.value.map((item): MixedEntry => ({ kind: 'plugins', label: 'Plugin', key: `plugins/${item.id}`, createdAt: item.createdAt, item })),
    ...widgets.value.map((item): MixedEntry => ({ kind: 'widgets', label: 'Widget', key: `widgets/${item.id}`, createdAt: item.createdAt, item })),
    ...skills.value.map((item): MixedEntry => ({ kind: 'skills', label: 'Skill', key: `skills/${item.id}`, createdAt: item.createdAt, item })),
    ...queries.value.map((item): MixedEntry => ({ kind: 'queries', label: 'Query', key: `queries/${item.id}`, createdAt: item.createdAt, item })),
  ]
  return all
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MIXED_COUNT)
})

// Surface 3 — who publishes here. Counts are real; the order is by count, not by merit.
const AUTHOR_COUNT = 12

const authors = computed(() => {
  const tally = new Map<string, number>()
  const bump = (name: string) => tally.set(name, (tally.get(name) ?? 0) + 1)
  themes.value.forEach((t) => bump(t.author))
  plugins.value.forEach((p) => bump(p.author))
  widgets.value.forEach((w) => bump(w.author))
  skills.value.forEach((s) => bump(s.author))
  queries.value.forEach((q) => bump(q.author))
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, AUTHOR_COUNT)
    .map(([name, count]) => ({ name, count }))
})

function go(tab: Kind) {
  activeTab.value = tab
}

function searchAuthor(name: string) {
  activeTab.value = 'themes'
  query.value = name
}
</script>

<template>
  <div class="home">
    <!-- Positioning, not a hero: no display type, no centring, no CTA. -->
    <section class="home-intro">
      <div class="home-intro-copy">
        <p class="home-lead">
          NoteDeck と Misskey の拡張を置いておくところ。
        </p>
        <p class="home-sub">
          テーマ・プラグイン・ウィジェット・クエリ・スキルを探して、ソースを読んで、
          自分のサーバーにそのまま入れられます。カタログは静的 JSON でも配信しているので、
          NoteDeck のストアカラムからも同じものが見えます。
        </p>
      </div>

      <nav class="kind-index" aria-label="種別">
        <button
          v-for="k in kinds"
          :key="k.kind"
          class="kind-row"
          type="button"
          @click="go(k.kind)"
        >
          <span class="kind-name">{{ k.label }}</span>
          <span class="kind-blurb">{{ k.blurb }}</span>
          <span class="kind-count">
            <template v-if="loaded">{{ k.count }}</template>
            <template v-else>—</template>
          </span>
        </button>
      </nav>
    </section>

    <template v-if="loaded">
      <section v-if="recentMixed.length" class="home-rail">
        <div class="rail-head">
          <h2 class="rail-title">新着</h2>
          <p class="rail-note">種別をまたいだ、いちばん新しい {{ recentMixed.length }} 件。</p>
        </div>
        <div class="store-grid">
          <div v-for="e in recentMixed" :key="e.key" class="mix-cell">
            <span class="mix-kind">{{ e.label }}</span>
            <ThemeItem v-if="e.kind === 'themes'" :theme="e.item" />
            <PluginItem v-else-if="e.kind === 'plugins'" :plugin="e.item" />
            <WidgetItem v-else-if="e.kind === 'widgets'" :widget="e.item" />
            <SkillItem v-else-if="e.kind === 'skills'" :skill="e.item" />
            <QueryItem v-else :entry="e.item" />
          </div>
        </div>
      </section>

      <section v-if="authors.length" class="home-rail home-rail-authors">
        <div class="rail-head">
          <h2 class="rail-title">作者</h2>
          <p class="rail-note">公開している人と、その点数。名前を押すと絞り込みます。</p>
        </div>
        <ul class="author-index">
          <li v-for="a in authors" :key="a.name">
            <button class="author-row" type="button" @click="searchAuthor(a.name)">
              <span class="author-name">{{ a.name }}</span>
              <span class="author-count">{{ a.count }}</span>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
}

/* Deliberately unbalanced: prose gets the wide track, the index the narrow one. */
.home-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: var(--space-2lg);
  align-items: start;
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--border);
}

.home-lead {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--text);
  overflow-wrap: anywhere;
}

.home-sub {
  margin-top: var(--space-sm);
  max-width: 54ch;
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--text-sub);
}

/* Type index — a dense list with tabular counts, not a row of identical tiles. */
.kind-index {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}

.kind-row {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-2xs);
  border: 0;
  border-bottom: 1px solid var(--border);
  background: none;
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
}

.kind-row:hover { background: var(--surface); }
.kind-row:active { background: var(--surface-active); }

.kind-name {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text);
}

.kind-blurb {
  font-size: var(--text-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kind-count {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--accent-text);
  font-variant-numeric: tabular-nums;
}

/* Rails — each one is a different cut of the registry, not the same cut repeated. */
.home-rail { padding-top: var(--space-xl); }
.home-rail-authors { padding-top: var(--space-2xl); }

.rail-head { margin-bottom: var(--space-md); }

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

.mix-cell {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--space-2xs);
  min-width: 0;
}

.mix-kind {
  font-size: var(--text-2xs);
  font-weight: 700;
  color: var(--accent-text);
  padding-inline-start: var(--space-3xs);
}

.author-index {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 0 var(--space-lg);
  list-style: none;
}

.author-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-xs) var(--space-2xs);
  border: 0;
  border-bottom: 1px solid var(--border);
  background: none;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-sub);
  text-align: left;
  cursor: pointer;
  transition: color var(--duration-base) var(--ease-out);
}

.author-row:hover { color: var(--accent-text); }
.author-row:active { color: var(--accent-strong); }

.author-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-count {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .home-intro { grid-template-columns: minmax(0, 1fr); gap: var(--space-lg); }
}

@media (max-width: 800px) {
  .home { padding: var(--space-lg) var(--space-md) var(--space-xl); }
  .home-rail { padding-top: var(--space-lg); }
  .home-rail-authors { padding-top: var(--space-xl); }
  .kind-row { grid-template-columns: minmax(0, 1fr) auto; }
  .kind-blurb { display: none; }
}
</style>
