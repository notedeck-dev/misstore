<script setup lang="ts">
import type { ContractProfile, ItemContract } from '@/types'
import { useI18n } from '@/i18n'

// runsOn はプラグインだけ出す (ウィジェット・スキルは常に NoteDeck 専用)
defineProps<{ contract?: ItemContract; kind: 'plugin' | 'widget' | 'skill' }>()
const { t } = useI18n()

// 色は意味で統一: readonly = 中立 / safe = 成功 / full・外部通信 = 注意
const PROFILE_CLASS: Record<ContractProfile, string> = {
  readonly: 'badge-neutral',
  safe: 'badge-ok',
  full: 'badge-warn',
}
</script>

<template>
  <div
    v-if="contract && (kind === 'plugin' || contract.profile || contract.external)"
    class="vsx-badges"
  >
    <span v-if="kind === 'plugin'" class="badge badge-neutral">
      {{ contract.runsOn.includes('misskey-web') ? t.contract.runsOnMisskeyWeb : t.contract.runsOnNotedeck }}
    </span>
    <span v-if="contract.profile" class="badge" :class="PROFILE_CLASS[contract.profile]">
      {{ t.contract.profile[contract.profile] }}
    </span>
    <span v-if="contract.external" class="badge badge-warn">{{ t.contract.external }}</span>
  </div>
</template>
