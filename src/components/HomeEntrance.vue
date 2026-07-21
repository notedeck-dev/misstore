<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import WidgetItem from '@/components/WidgetItem.vue'
import SkillItem from '@/components/SkillItem.vue'
import QueryItem from '@/components/QueryItem.vue'

const { plugins, themes, widgets, skills, queries, loaded, activeTab } = useStore()

const RECENT_COUNT = 5

function pickRecent<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_COUNT)
}

const recentPlugins = computed(() => pickRecent(plugins.value))
const recentThemes = computed(() => pickRecent(themes.value))
const recentWidgets = computed(() => pickRecent(widgets.value))
const recentSkills = computed(() => pickRecent(skills.value))
const recentQueries = computed(() => pickRecent(queries.value))

function go(tab: 'plugins' | 'themes' | 'widgets' | 'skills' | 'queries') {
  activeTab.value = tab
}
</script>

<template>
  <section class="home-hero">
    <h1 class="home-hero-title">
      mis<span>store</span>
    </h1>
    <p class="home-hero-lead">
      Misskey / NoteDeck 向けのプラグイン・テーマ・ウィジェットストア。
    </p>
    <p class="home-hero-sub">
      AiScript プラグイン、Misskey 互換テーマ、NoteDeck ウィジェットテンプレートを
      ブラウザから検索・プレビュー・ワンクリックでインストール。
    </p>
  </section>

  <section class="home-cards">
    <button class="vsx-card vsx-card-link home-card" type="button" @click="go('plugins')">
      <div class="vsx-body">
        <div class="vsx-icon-plain" aria-hidden="true" style="color: var(--accent)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/></svg>
        </div>
        <div class="vsx-details">
          <div class="vsx-name">Plugins</div>
          <div class="home-card-count">
            <template v-if="loaded"><span class="home-card-count-num">{{ plugins.length }}</span> items</template>
            <template v-else><span class="home-card-count-skel"></span></template>
          </div>
          <p class="vsx-desc">タイムラインや投稿を拡張する AiScript プラグイン。</p>
        </div>
      </div>
      <div class="vsx-footer home-card-footer">
        <span class="home-card-cta">Browse →</span>
      </div>
    </button>
    <button class="vsx-card vsx-card-link home-card" type="button" @click="go('themes')">
      <div class="vsx-body">
        <div class="vsx-icon-plain" aria-hidden="true" style="color: var(--accent)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
        </div>
        <div class="vsx-details">
          <div class="vsx-name">Themes</div>
          <div class="home-card-count">
            <template v-if="loaded"><span class="home-card-count-num">{{ themes.length }}</span> items</template>
            <template v-else><span class="home-card-count-skel"></span></template>
          </div>
          <p class="vsx-desc">配色を丸ごと入れ替える Misskey 互換テーマ。</p>
        </div>
      </div>
      <div class="vsx-footer home-card-footer">
        <span class="home-card-cta">Browse →</span>
      </div>
    </button>
    <button class="vsx-card vsx-card-link home-card" type="button" @click="go('widgets')">
      <div class="vsx-body">
        <div class="vsx-icon-plain" aria-hidden="true" style="color: var(--accent)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        </div>
        <div class="vsx-details">
          <div class="vsx-name">Widgets</div>
          <div class="home-card-count">
            <template v-if="loaded"><span class="home-card-count-num">{{ widgets.length }}</span> items</template>
            <template v-else><span class="home-card-count-skel"></span></template>
          </div>
          <p class="vsx-desc">NoteDeck のカラムに追加できるウィジェット。</p>
        </div>
      </div>
      <div class="vsx-footer home-card-footer">
        <span class="home-card-cta">Browse →</span>
      </div>
    </button>
    <button class="vsx-card vsx-card-link home-card" type="button" @click="go('queries')">
      <div class="vsx-body">
        <div class="vsx-icon-plain" aria-hidden="true" style="color: var(--accent)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        </div>
        <div class="vsx-details">
          <div class="vsx-name">Queries</div>
          <div class="home-card-count">
            <template v-if="loaded"><span class="home-card-count-num">{{ queries.length }}</span> items</template>
            <template v-else><span class="home-card-count-skel"></span></template>
          </div>
          <p class="vsx-desc">カラムを絞り込む AiScript フィルタクエリ。</p>
        </div>
      </div>
      <div class="vsx-footer home-card-footer">
        <span class="home-card-cta">Browse →</span>
      </div>
    </button>
    <button class="vsx-card vsx-card-link home-card" type="button" @click="go('skills')">
      <div class="vsx-body">
        <div class="vsx-icon-plain" aria-hidden="true" style="color: var(--accent)">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/></svg>
        </div>
        <div class="vsx-details">
          <div class="vsx-name">Skills</div>
          <div class="home-card-count">
            <template v-if="loaded"><span class="home-card-count-num">{{ skills.length }}</span> items</template>
            <template v-else><span class="home-card-count-skel"></span></template>
          </div>
          <p class="vsx-desc">NoteDeck の AI に持たせるシステムプロンプト。</p>
        </div>
      </div>
      <div class="vsx-footer home-card-footer">
        <span class="home-card-cta">Browse →</span>
      </div>
    </button>
  </section>

  <template v-if="loaded">
    <section v-if="recentPlugins.length" class="home-section">
      <header class="home-section-head">
        <h2 class="home-section-title">New in Plugins</h2>
        <button class="home-section-more" type="button" @click="go('plugins')">See all →</button>
      </header>
      <div class="store-grid">
        <PluginItem v-for="p in recentPlugins" :key="p.id" :plugin="p" />
      </div>
    </section>

    <section v-if="recentThemes.length" class="home-section">
      <header class="home-section-head">
        <h2 class="home-section-title">New in Themes</h2>
        <button class="home-section-more" type="button" @click="go('themes')">See all →</button>
      </header>
      <div class="store-grid">
        <ThemeItem v-for="t in recentThemes" :key="t.id" :theme="t" />
      </div>
    </section>

    <section v-if="recentWidgets.length" class="home-section">
      <header class="home-section-head">
        <h2 class="home-section-title">New in Widgets</h2>
        <button class="home-section-more" type="button" @click="go('widgets')">See all →</button>
      </header>
      <div class="store-grid">
        <WidgetItem v-for="w in recentWidgets" :key="w.id" :widget="w" />
      </div>
    </section>

    <section v-if="recentQueries.length" class="home-section">
      <header class="home-section-head">
        <h2 class="home-section-title">New in Queries</h2>
        <button class="home-section-more" type="button" @click="go('queries')">See all →</button>
      </header>
      <div class="store-grid">
        <QueryItem v-for="s in recentQueries" :key="s.id" :entry="s" />
      </div>
    </section>

    <section v-if="recentSkills.length" class="home-section">
      <header class="home-section-head">
        <h2 class="home-section-title">New in Skills</h2>
        <button class="home-section-more" type="button" @click="go('skills')">See all →</button>
      </header>
      <div class="store-grid">
        <SkillItem v-for="s in recentSkills" :key="s.id" :skill="s" />
      </div>
    </section>
  </template>
</template>

<style scoped>
.home-hero {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 40px 24px 16px;
  text-align: center;
}

.home-hero-title {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--text);
}

.home-hero-title span {
  color: var(--accent);
}

.home-hero-lead {
  margin-top: 14px;
  font-size: 15px;
  color: var(--text-sub);
}

.home-hero-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.home-cards {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 20px 24px 8px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

/* ボタン要素の UA スタイルをリセットしつつ vsx-card に乗せる */
.home-card {
  width: 100%;
  padding: 0;
  text-align: left;
  font-family: var(--font-body);
  color: var(--text);
}

.home-card-count {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
  min-height: 22px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.home-card-count-num {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.home-card-count-skel {
  display: inline-block;
  width: 56px;
  height: 10px;
  border-radius: var(--radius-xs);
  background: var(--surface-active);
}

.home-card-footer {
  align-items: center;
  justify-content: flex-end;
}

.home-card-cta {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.home-section {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 16px 24px 8px;
}

.home-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.home-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.01em;
}

.home-section-more {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-xs);
  transition: color var(--duration-base), background var(--duration-base);
}

.home-section-more:hover {
  color: var(--accent);
  background: var(--surface-hover);
}

@media (max-width: 900px) {
  .home-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 800px) {
  .home-hero { padding: 28px 16px 8px; }
  .home-hero-title { font-size: 34px; }
  .home-cards { padding: 14px 16px 4px; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .home-section { padding: 12px 16px 4px; }
}
</style>
