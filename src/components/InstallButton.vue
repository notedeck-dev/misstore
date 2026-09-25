<script setup lang="ts">
import { useStore } from '@/composables/useStore'
import { useI18n } from '@/i18n'

const props = defineProps<{ apiUrl: string; sha512: string }>()
const { buildInstallUrl } = useStore()
const { t } = useI18n()

function openMisskeyInstall() {
  const url = buildInstallUrl(props.apiUrl, props.sha512)
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <button
    class="vsx-btn vsx-btn-primary"
    :disabled="!buildInstallUrl(apiUrl, sha512)"
    :title="buildInstallUrl(apiUrl, sha512) ? t.install.ready : t.install.needHost"
    @click.stop="openMisskeyInstall"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Install
  </button>
</template>
