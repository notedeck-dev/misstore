import { createRouter, createWebHistory } from 'vue-router'
import StorePage from '@/pages/StorePage.vue'
import { LOCALE_PREFIX_PATTERN, localeOf } from '@/i18n'

const prefix = `/:locale(${LOCALE_PREFIX_PATTERN})?`

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: `${prefix}/`, component: StorePage },
    {
      path: `${prefix}/plugins/:id`,
      component: () => import('@/pages/PluginDetail.vue'),
    },
    {
      path: `${prefix}/themes/:id`,
      component: () => import('@/pages/ThemeDetail.vue'),
    },
    {
      path: `${prefix}/widgets/:id`,
      component: () => import('@/pages/WidgetDetail.vue'),
    },
    {
      path: `${prefix}/skills/:id`,
      component: () => import('@/pages/SkillDetail.vue'),
    },
    {
      path: `${prefix}/queries/:id`,
      component: () => import('@/pages/QueryDetail.vue'),
    },
  ],
})

router.afterEach((to) => {
  document.documentElement.lang = localeOf(to.params.locale)
})

export default router
