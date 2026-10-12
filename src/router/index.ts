import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { dashboardRouteByRole } from '@/types/roles'

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
    {
      path: '/dashboard',
      component: () => import('@/Components/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/OperatorDashboardPage.vue'),
          meta: { title: 'Dashboard', allowedRoles: ['operator'] },
        },
        {
          path: 'companies',
          name: 'companies',
          component: () => import('@/pages/operator/CompaniesPage.vue'),
          meta: { title: 'Entreprises', allowedRoles: ['operator'] },
        },
        {
          path: 'companies/new',
          name: 'company-create',
          component: () => import('@/pages/operator/CompanyFormPage.vue'),
          meta: { title: 'Nouvelle entreprise', allowedRoles: ['operator'] },
        },
        {
          path: 'companies/:companyId',
          name: 'company-details',
          component: () => import('@/pages/operator/CompanyDetailsPage.vue'),
          meta: { title: 'Détail entreprise', allowedRoles: ['operator'] },
        },
        {
          path: 'companies/:companyId/edit',
          name: 'company-edit',
          component: () => import('@/pages/operator/CompanyFormPage.vue'),
          meta: { title: 'Modifier l’entreprise', allowedRoles: ['operator'] },
        },
        {
          path: 'offers',
          name: 'offers',
          component: () => import('@/pages/operator/OffersPage.vue'),
          meta: { title: 'Offres', allowedRoles: ['operator'] },
        },
        {
          path: 'offers/new',
          name: 'offer-create',
          component: () => import('@/pages/operator/OfferFormPage.vue'),
          meta: { title: 'Nouvelle offre', allowedRoles: ['operator'] },
        },
        {
          path: 'offers/:offerId',
          name: 'offer-details',
          component: () => import('@/pages/operator/OfferDetailsPage.vue'),
          meta: { title: 'Détail offre', allowedRoles: ['operator'] },
        },
        {
          path: 'offers/:offerId/edit',
          name: 'offer-edit',
          component: () => import('@/pages/operator/OfferFormPage.vue'),
          meta: { title: 'Modifier l’offre', allowedRoles: ['operator'] },
        },
        {
          path: 'platform-monitoring',
          name: 'platform-monitoring',
          component: () => import('@/pages/operator/PlatformMonitoringPage.vue'),
          meta: { title: 'Supervision', allowedRoles: ['operator'] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: {
            title: 'Paramètres',
            allowedRoles: ['operator', 'administrator', 'supervisor', 'teamLeader'],
          },
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/Components/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/pages/administrator/AdministratorDashboardPage.vue'),
          meta: { title: 'Dashboard', allowedRoles: ['administrator'] },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/administrator/UsersPage.vue'),
          meta: { title: 'Utilisateurs', allowedRoles: ['administrator'] },
        },
        {
          path: 'users/new',
          name: 'admin-user-create',
          component: () => import('@/pages/administrator/UserFormPage.vue'),
          meta: { title: 'Nouvel utilisateur', allowedRoles: ['administrator'] },
        },
        {
          path: 'users/import',
          name: 'admin-user-import',
          component: () => import('@/pages/administrator/UserImportPage.vue'),
          meta: { title: 'Importer des utilisateurs', allowedRoles: ['administrator'] },
        },
        {
          path: 'users/:userId',
          name: 'admin-user-details',
          component: () => import('@/pages/administrator/UserDetailsPage.vue'),
          meta: { title: 'Détail utilisateur', allowedRoles: ['administrator'] },
        },
        {
          path: 'users/:userId/edit',
          name: 'admin-user-edit',
          component: () => import('@/pages/administrator/UserFormPage.vue'),
          meta: { title: 'Modifier l’utilisateur', allowedRoles: ['administrator'] },
        },
        {
          path: 'sites',
          name: 'admin-sites',
          component: () => import('@/pages/administrator/SitesPage.vue'),
          meta: { title: 'Sites', allowedRoles: ['administrator'] },
        },
        {
          path: 'sites/new',
          name: 'admin-site-create',
          component: () => import('@/pages/administrator/SiteFormPage.vue'),
          meta: { title: 'Nouveau site', allowedRoles: ['administrator'] },
        },
        {
          path: 'sites/:siteId',
          name: 'admin-site-details',
          component: () => import('@/pages/administrator/SiteDetailsPage.vue'),
          meta: { title: 'Détail site', allowedRoles: ['administrator'] },
        },
        {
          path: 'sites/:siteId/edit',
          name: 'admin-site-edit',
          component: () => import('@/pages/administrator/SiteFormPage.vue'),
          meta: { title: 'Modifier le site', allowedRoles: ['administrator'] },
        },
        {
          path: 'missions',
          name: 'admin-missions',
          component: () => import('@/pages/administrator/MissionsPage.vue'),
          meta: { title: 'Missions', allowedRoles: ['administrator'] },
        },
        {
          path: 'missions/new',
          name: 'admin-mission-create',
          component: () => import('@/pages/administrator/MissionFormPage.vue'),
          meta: { title: 'Nouvelle mission', allowedRoles: ['administrator'] },
        },
        {
          path: 'missions/:missionId',
          name: 'admin-mission-details',
          component: () => import('@/pages/administrator/MissionDetailsPage.vue'),
          meta: { title: 'Détail mission', allowedRoles: ['administrator'] },
        },
        {
          path: 'missions/:missionId/edit',
          name: 'admin-mission-edit',
          component: () => import('@/pages/administrator/MissionFormPage.vue'),
          meta: { title: 'Modifier la mission', allowedRoles: ['administrator'] },
        },
        {
          path: 'qr-codes',
          name: 'admin-qr-codes',
          component: () => import('@/pages/administrator/QrCodesPage.vue'),
          meta: { title: 'QR codes', allowedRoles: ['administrator'] },
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: { title: 'Paramètres', allowedRoles: ['administrator'] },
        },
      ],
    },
    {
      path: '/supervisor',
      component: () => import('@/Components/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'supervisor-dashboard',
          component: () => import('@/pages/ProfileDashboardPage.vue'),
          meta: { title: 'Dashboard', allowedRoles: ['supervisor'] },
        },
        {
          path: 'settings',
          name: 'supervisor-settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: { title: 'Paramètres', allowedRoles: ['supervisor'] },
        },
      ],
    },
    {
      path: '/team-leader',
      component: () => import('@/Components/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'team-leader-dashboard',
          component: () => import('@/pages/ProfileDashboardPage.vue'),
          meta: { title: 'Dashboard', allowedRoles: ['teamLeader'] },
        },
        {
          path: 'settings',
          name: 'team-leader-settings',
          component: () => import('@/pages/SettingsPage.vue'),
          meta: { title: 'Paramètres', allowedRoles: ['teamLeader'] },
        },
      ],
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/pages/system/UnauthorizedPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/system/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth,
  )

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (
    to.name === 'login' &&
    authStore.isAuthenticated &&
    authStore.activeRole
  ) {
    return {
      name: dashboardRouteByRole[authStore.activeRole],
    }
  }

  const allowedRoles = to.meta.allowedRoles

  if (
    allowedRoles?.length &&
    (!authStore.activeRole ||
      !allowedRoles.includes(authStore.activeRole))
  ) {
    return { name: 'unauthorized' }
  }

  return true
})

export default router
