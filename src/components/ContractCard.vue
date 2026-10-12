<script setup lang="ts">
import { computed } from 'vue'
import type { ItemContract } from '@/types'
import ContractBadges from '@/components/ContractBadges.vue'
import { useI18n } from '@/i18n'

// declared は meta.permissions (プラグインのみ)。渡さなければ突き合わせをしない
const props = defineProps<{
  contract?: ItemContract
  kind: 'plugin' | 'widget' | 'skill'
  declared?: string[]
}>()
const { t } = useI18n()

// 宣言と導出の突き合わせ (CI の verify-contract と同じ基準)。宣言が本家 Misskey のスコープ
// (`read:account` のように `:` を含む) で書かれている旧形式は NoteDeck の key と比較できないので見ない
const comparable = computed(
  () => !!props.contract && !!props.declared && !props.declared.some((p) => p.includes(':')),
)
const missing = computed(() =>
  comparable.value ? props.contract!.permissions.filter((p) => !props.declared!.includes(p)) : [],
)
const declaredOnly = computed(() =>
  comparable.value ? props.declared!.filter((p) => !props.contract!.permissions.includes(p)) : [],
)
const hasCalls = computed(() => {
  const c = props.contract
  return !!c && (c.ndCalls.length > 0 || c.mkApi.length > 0 || c.hooks.length > 0 || c.external)
})
</script>

<template>
  <aside class="detail-sidebar">
    <h3 class="detail-more-info-title">{{ t.contract.title }}</h3>
    <template v-if="contract">
      <ContractBadges :contract="contract" :kind="kind" />
      <dl v-if="hasCalls" class="detail-info-list">
        <div v-if="contract.permissions.length" class="detail-info-item">
          <dt>Permissions</dt>
          <dd class="detail-tags">
            <span
              v-for="p in contract.permissions"
              :key="p"
              class="detail-tag"
              :class="{ 'detail-tag-undeclared': missing.includes(p) }"
            >{{ p }}</span>
          </dd>
        </div>
        <div v-if="contract.ndCalls.length" class="detail-info-item">
          <dt>Nd:call</dt>
          <dd class="detail-tags">
            <span v-for="c in contract.ndCalls" :key="c" class="detail-tag">{{ c }}</span>
          </dd>
        </div>
        <div v-if="contract.mkApi.length" class="detail-info-item">
          <dt>Mk:api</dt>
          <dd class="detail-tags">
            <span v-for="e in contract.mkApi" :key="e" class="detail-tag">{{ e }}</span>
          </dd>
        </div>
        <div v-if="contract.hooks.length" class="detail-info-item">
          <dt>{{ t.contract.hooks }}</dt>
          <dd class="detail-tags">
            <span v-for="h in contract.hooks" :key="h" class="detail-tag">{{ h }}</span>
          </dd>
        </div>
        <div class="detail-info-item">
          <dt>{{ t.contract.externalLabel }}</dt>
          <dd>{{ contract.external ? t.contract.externalYes : t.contract.externalNo }}</dd>
        </div>
      </dl>
      <p v-else class="detail-permissions-empty">{{ t.contract.none }}</p>
      <p v-if="contract.unresolved.length" class="contract-note contract-note-warn">
        {{ t.contract.unresolved(contract.unresolved.length) }}
      </p>
      <p v-if="missing.length" class="contract-note contract-note-warn">
        {{ t.contract.undeclared(missing.length) }}
      </p>
      <p v-if="declaredOnly.length" class="contract-note">
        {{ t.contract.declaredOnly(declaredOnly) }}
      </p>
      <p class="contract-note">{{ t.contract.note }}</p>
    </template>
    <p v-else class="detail-permissions-empty">{{ t.contract.missing }}</p>
  </aside>
</template>
