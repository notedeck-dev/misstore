<script setup lang="ts">
import StoreHeader from '@/components/StoreHeader.vue'
import PluginItem from '@/components/PluginItem.vue'
import ThemeItem from '@/components/ThemeItem.vue'
import StoreEmpty from '@/components/StoreEmpty.vue'
import { useStore } from '@/composables/useStore'

const { activeTab, filteredPlugins, filteredThemes, loaded, resultCount } = useStore()
</script>

<template>
  <StoreHeader />
  <main class="store-body">
    <template v-if="loaded">
      <template v-if="activeTab === 'plugins'">
        <div v-if="filteredPlugins.length" class="store-list">
          <PluginItem v-for="p in filteredPlugins" :key="p.id" :plugin="p" />
        </div>
        <StoreEmpty v-else />
      </template>
      <template v-else>
        <div v-if="filteredThemes.length" class="store-list">
          <ThemeItem v-for="t in filteredThemes" :key="t.id" :theme="t" />
        </div>
        <StoreEmpty v-else />
      </template>
    </template>
    <div v-else class="store-loading">Loading...</div>
  </main>
</template>
