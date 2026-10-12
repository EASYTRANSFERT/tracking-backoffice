import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: {
        name: 'login',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    /*{
      path: '/dashboard',
      name: 'dashboard',
      //component: () => import('@/pages/Dashboard.vue'),
    }*/
  ],
})

export default router
