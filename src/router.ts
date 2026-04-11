import { createRouter, createWebHistory } from 'vue-router'
import StorePage from '@/pages/StorePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: StorePage },
    {
      path: '/plugins/:id',
      component: () => import('@/pages/PluginDetail.vue'),
    },
    {
      path: '/themes/:id',
      component: () => import('@/pages/ThemeDetail.vue'),
    },
  ],
})

export default router
