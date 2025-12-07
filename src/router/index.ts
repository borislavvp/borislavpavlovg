import { createRouter, createWebHistory } from 'vue-router'
import ModelHome from '@/views/ModelHome.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ModelHome
    },
    {
      path: '/obrazcov-dom',
      name: 'obrazcov-dom',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: ModelHome
    },
    {
      path: '/baobab',
      name: 'baobab',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Baobab.vue')
    },
  ]
})

export default router
