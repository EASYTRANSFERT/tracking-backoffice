import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginAuth.vue'),
    },
    /*{
      path: '/dashboard',
      name: 'dashboard',
      //component: () => import('@/pages/Dashboard.vue'),
    }*/
  ],
})

export default router
