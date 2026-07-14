<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/composables/useStore'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import WidgetItem from '@/components/WidgetItem.vue'
import SkillItem from '@/components/SkillItem.vue'

const { plugins, themes, widgets, skills, loaded, activeTab } = useStore()

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

function go(tab: 'plugins' | 'themes' | 'widgets' | 'skills') {
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
        <div class="vsx-icon-plain" aria-hidden="true">🧩</div>
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
        <div class="vsx-icon-plain" aria-hidden="true">🎨</div>
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
