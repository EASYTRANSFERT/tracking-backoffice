<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { dashboardNavigation } from '@/config/dashboard-navigation'
import { roleLabelByRole } from '@/types/roles'
import { useAuthStore } from '@/stores/auth.store'

const drawer = defineModel<boolean>({ default: true })
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const { activeRole, currentUser } = storeToRefs(authStore)

const navigationItems = computed(() => {
  if (!activeRole.value) return []

  return dashboardNavigation.filter((item) =>
    item.allowedRoles.includes(activeRole.value!) && (mockMode || !item.prototypeOnly),
  )
})

const settingsRoute = computed(() => {
  switch (activeRole.value) {
    case 'administrator':
      return 'admin-settings'
    case 'supervisor':
      return 'supervisor-settings'
    case 'teamLeader':
      return 'team-leader-settings'
    default:
      return 'settings'
  }
})

const profile = computed(() => {
  const name = currentUser.value?.names ?? 'Utilisateur'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return {
    initials,
    name,
    label: activeRole.value
      ? roleLabelByRole[activeRole.value]
      : 'Profil indisponible',
  }
})

const routeGroups: Record<string, string[]> = {
  companies: ['companies', 'company-create', 'company-details', 'company-edit'],
  offers: ['offers', 'offer-create', 'offer-details', 'offer-edit'],
  'admin-users': ['admin-users', 'admin-user-create', 'admin-user-import', 'admin-user-details', 'admin-user-edit'],
  'admin-teams': ['admin-teams', 'admin-team-create', 'admin-team-edit'],
  'admin-sites': ['admin-sites', 'admin-site-create', 'admin-site-import', 'admin-site-details', 'admin-site-edit'],
  'admin-missions': ['admin-missions', 'admin-mission-create', 'admin-mission-details', 'admin-mission-edit'],
  'supervisor-users': ['supervisor-users'],
  'team-leader-users': ['team-leader-users'],
}

function isItemActive(routeName: string) {
  const currentRouteName = String(route.name ?? '')
  return (routeGroups[routeName] ?? [routeName]).includes(currentRouteName)
}

async function handleLogout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    width="272"
    color="surface"
    class="app-sidebar border-e-sm"
  >
    <div class="flex h-full min-h-0 flex-col overflow-hidden">
      <div class="flex h-[108px] items-center px-7"><img src="@/assets/kaybiclogo.png" alt="Kaybic Africa" class="h-16 w-auto object-contain" /></div>
      <v-divider />

      <div class="shrink-0 px-4 pt-7">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">Menu principal</p>
        <nav aria-label="Menu principal" class="space-y-2">
          <RouterLink
            v-for="item in navigationItems"
            :key="item.routeName"
            :to="{ name: item.routeName }"
            class="relative flex min-h-[52px] items-center rounded-2xl px-3 text-[15px] font-medium text-[#3f434d] no-underline transition-colors hover:bg-[#f7f7f8]"
            :class="isItemActive(item.routeName)
              ? 'bg-[#FDE9EA] font-semibold !text-[#D80F16]'
              : ''"
          >
            <span
              class="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full"
              :class="isItemActive(item.routeName) ? 'bg-[#D80F16]' : 'bg-transparent'"
              aria-hidden="true"
            />
            <span class="mr-4 flex h-6 w-6 shrink-0 items-center justify-center">
              <img
                v-if="item.iconSrc"
                :src="item.iconSrc"
                alt=""
                aria-hidden="true"
                class="h-[22px] w-[22px] object-contain transition"
                :class="isItemActive(item.routeName)
                  ? 'sidebar-nav-icon--active'
                  : 'sidebar-nav-icon--inactive'"
              />
              <v-icon
                v-else
                :icon="item.icon"
                :color="isItemActive(item.routeName) ? 'primary' : undefined"
                class="sidebar-nav-mdi"
                size="24"
              />
            </span>
            <span>{{ item.title }}</span>
          </RouterLink>
        </nav>
      </div>

      <v-spacer />

      <div class="shrink-0 px-4 pb-4">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">Mon compte</p>
        <v-list nav density="default" class="account-navigation space-y-1 bg-transparent pa-0">
          <v-list-item prepend-icon="mdi-cog-outline" title="Paramètres" value="settings" :to="{ name: settingsRoute }" rounded="lg" />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Se déconnecter"
            value="logout"
            rounded="lg"
            class="text-red-600"
            @click="handleLogout"
          />
        </v-list>
        <v-divider class="my-4" />
        <div class="flex items-center gap-3 px-3 py-2">
          <v-avatar color="primary" size="38"><span class="text-xs font-bold text-white">{{ profile.initials }}</span></v-avatar>
          <div class="min-w-0"><p class="truncate text-xs font-bold text-[#292d38]">{{ profile.name }}</p><p class="text-[10px] text-[#848484]">{{ profile.label }}</p></div>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
:deep(.v-navigation-drawer__content) {
  height: 100% !important;
  overflow: hidden !important;
}

.app-sidebar {
  position: fixed !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;
}

.sidebar-nav-mdi,
:deep(.account-navigation .v-icon) {
  -webkit-text-stroke: 0.35px currentColor;
}

:deep(.account-navigation .v-list-item) {
  min-height: 52px;
  font-size: 15px;
  font-weight: 500;
  color: #3f434d;
}

:deep(.account-navigation .v-icon) {
  font-size: 25px;
}

.sidebar-nav-icon--active {
  filter: brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(5223%)
    hue-rotate(351deg) brightness(93%) contrast(101%);
  opacity: 1;
}

.sidebar-nav-icon--inactive {
  filter: grayscale(1);
  opacity: 0.6;
}
</style>
