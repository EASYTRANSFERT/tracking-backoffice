<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
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
}

function isItemActive(routeName: string) {
  const currentRouteName = String(route.name ?? '')
  return (routeGroups[routeName] ?? [routeName]).includes(currentRouteName)
}

async function handleLogout() {
  await authStore.logout()
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
    <div class="flex h-full flex-col">
      <div class="flex h-[108px] items-center px-7"><img src="@/assets/kaybiclogo.png" alt="Kaybic Africa" class="h-16 w-auto object-contain" /></div>
      <v-divider />

      <div class="px-4 pt-7">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">Menu principal</p>
        <v-list nav density="default" color="primary" class="space-y-2 bg-transparent pa-0">
          <v-list-item
            v-for="item in navigationItems"
            :key="item.routeName"
            :title="item.title"
            :value="item.routeName"
            :to="{ name: item.routeName }"
            :active="isItemActive(item.routeName)"
            active-class="sidebar-item--active"
            class="relative min-h-[52px] !rounded-2xl px-3 text-[#535865] transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-transparent [&.sidebar-item--active]:!bg-[#FDE9EA] [&.sidebar-item--active]:!font-bold [&.sidebar-item--active]:!text-[#D80F16] [&.sidebar-item--active]:before:bg-[#D80F16]"
          >
            <template #prepend>
              <img
                v-if="item.iconSrc"
                :src="item.iconSrc"
                alt=""
                aria-hidden="true"
                class="mr-4 h-5 w-5 object-contain transition"
                :class="isItemActive(item.routeName) ? 'opacity-100' : 'grayscale opacity-60'"
              />
              <v-icon v-else :icon="item.icon" class="mr-4" size="22" />
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-spacer />

      <div class="px-4 pb-4">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">Mon compte</p>
        <v-list nav density="default" class="space-y-1 bg-transparent pa-0">
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
  overflow-y: hidden !important;
}
</style>
