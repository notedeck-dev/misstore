<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { useI18n } from '@/i18n'

const props = defineProps<{
  source: string
  lang: string
  filename?: string
}>()
const { t } = useI18n()

let highlighter: HighlighterCore | null = null
let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter() {
  if (highlighter) return Promise.resolve(highlighter)
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const [js, json, md, css, dark, light] = await Promise.all([
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/markdown.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/themes/github-dark.mjs'),
        import('shiki/themes/github-light.mjs'),
      ])
      highlighter = await createHighlighterCore({
        themes: [light.default, dark.default],
        langs: [js.default, json.default, md.default, css.default],
        engine: createJavaScriptRegexEngine(),
      })
      return highlighter
    })()
  }
  return highlighterPromise
}

const html = ref('')
const raw = ref('')
const copied = ref(false)
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    const url = props.source.startsWith('http')
      ? new URL(props.source).pathname
      : props.source.startsWith('/')
        ? props.source
        : `/${props.source}`
    const [res, hl] = await Promise.all([fetch(url), getHighlighter()])
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    raw.value = await res.text()
    html.value = hl.codeToHtml(raw.value, {
      lang: props.lang,
      themes: { light: 'github-light', dark: 'github-dark' },
    })
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [props.source, props.lang], load)

async function copyCode() {
  if (!raw.value) return
  await navigator.clipboard.writeText(raw.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="code-block">
    <div class="code-block-header">
      <span class="code-block-filename">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        {{ filename ?? lang }}
      </span>
      <button
        class="code-block-copy"
        :class="{ copied }"
        :disabled="!raw"
        :title="copied ? t.code.copied : t.code.copy"
        @click="copyCode"
      >
        <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <div v-if="loading" class="code-block-state">Loading source…</div>
    <div v-else-if="error" class="code-block-state code-block-error">Failed to load source ({{ error }})</div>
    <div v-else class="code-block-body" v-html="html"></div>
  </div>
</template>
