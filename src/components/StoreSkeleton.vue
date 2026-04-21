<template>
  <div class="store-grid">
    <div v-for="i in 6" :key="i" class="skeleton-card">
      <div class="skeleton-body">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-details">
          <div class="skeleton-line skeleton-line-title"></div>
          <div class="skeleton-line skeleton-line-meta"></div>
          <div class="skeleton-line skeleton-line-desc"></div>
          <div class="skeleton-line skeleton-line-desc short"></div>
        </div>
      </div>
      <div class="skeleton-footer"></div>
    </div>
  </div>
</template>
