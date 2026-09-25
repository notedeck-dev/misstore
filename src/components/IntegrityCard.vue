<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps<{ sha512: string }>()
const copied = ref(false)
const { t } = useI18n()

async function copyHash() {
  try {
    await navigator.clipboard.writeText(props.sha512)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Silently fail
  }
}
</script>

<template>
  <aside class="detail-sidebar detail-integrity">
    <h3 class="detail-more-info-title">Integrity</h3>
    <p class="detail-integrity-note">{{ t.integrity.note }}</p>
    <code class="detail-integrity-hash">{{ sha512.slice(0, 24) }}…</code>
    <button class="vsx-btn" :class="{ copied }" @click="copyHash">
      <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      {{ copied ? 'Copied!' : 'Copy SHA-512' }}
    </button>
  </aside>
</template>
