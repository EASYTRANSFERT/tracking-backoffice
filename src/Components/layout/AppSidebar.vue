<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLogo from '@/Components/common/AppLogo.vue'
import { dashboardNavigation } from '@/config/dashboard-navigation'
import { roleLabelByRole } from '@/types/roles'
import { useAuthStore } from '@/stores/auth.store'

const drawer = defineModel<boolean>({ default: true })
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const { activeRole, currentUser, tenant } = storeToRefs(authStore)

const navigationItems = computed(() => {
  if (!activeRole.value) return []

  return dashboardNavigation.filter(
    (item) => item.allowedRoles.includes(activeRole.value!) && (mockMode || !item.prototypeOnly),
  )
})

const settingsRoute = computed(() => {
  switch (activeRole.value) {
    case 'administrator':
      return 'admin-settings'
    case 'supervisor':
      return 'supervisor-settings'
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
    label: activeRole.value ? roleLabelByRole[activeRole.value] : 'Profil indisponible',
    company: tenant.value?.name ?? null,
  }
})

const routeGroups: Record<string, string[]> = {
  companies: [
    'companies',
    'company-create',
    'company-details',
    'company-edit',
    'company-admin-create',
  ],
  offers: ['offers', 'offer-create', 'offer-details', 'offer-edit'],
  'admin-users': [
    'admin-users',
    'admin-user-create',
    'admin-user-import',
    'admin-user-details',
    'admin-user-edit',
  ],
  'admin-teams': ['admin-teams', 'admin-team-create', 'admin-team-edit'],
  'admin-sites': [
    'admin-sites',
    'admin-site-create',
    'admin-site-import',
    'admin-site-details',
    'admin-site-edit',
  ],
  'admin-missions': [
    'admin-missions',
    'admin-mission-create',
    'admin-mission-details',
    'admin-mission-edit',
  ],
  'admin-periods': ['admin-periods', 'admin-period-details'],
  'admin-devices': ['admin-devices', 'admin-device-details'],
  'supervisor-missions': ['supervisor-missions', 'supervisor-mission-details'],
  'supervisor-periods': ['supervisor-periods', 'supervisor-period-details'],
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
    class="!fixed !h-dvh !max-h-dvh border-e-sm font-sans [&_.v-navigation-drawer__content]:!h-full [&_.v-navigation-drawer__content]:!overflow-hidden"
  >
    <div class="flex h-full min-h-0 flex-col overflow-hidden">
      <div class="flex h-[108px] shrink-0 items-center px-7 [@media(max-height:820px)]:h-[76px]">
        <AppLogo class="h-auto w-full max-w-52 object-contain" />
      </div>
      <v-divider />

      <!-- Seul le menu défile : sur un écran peu haut (projecteur, zoom du navigateur), le logo et le compte restent visibles. -->
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-7 [@media(max-height:820px)]:pt-4">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">
          Menu principal
        </p>
        <nav aria-label="Menu principal" class="space-y-2">
          <RouterLink
            v-for="item in navigationItems"
            :key="item.routeName"
            :to="{ name: item.routeName }"
            :data-tour="`nav-${item.routeName}`"
            class="relative flex min-h-[52px] items-center rounded-2xl [@media(max-height:820px)]:min-h-11 px-3 text-[15px] font-medium text-[#3f434d] no-underline transition-colors hover:bg-[#f7f7f8]"
            :class="
              isItemActive(item.routeName) ? 'bg-[#FDE9EA] font-semibold !text-[#D80F16]' : ''
            "
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
                :class="
                  isItemActive(item.routeName)
                    ? 'opacity-100 [filter:brightness(0)_saturate(100%)_invert(13%)_sepia(94%)_saturate(5223%)_hue-rotate(351deg)_brightness(93%)_contrast(101%)]'
                    : 'opacity-60 grayscale'
                "
              />
              <v-icon
                v-else
                :icon="item.icon"
                :color="isItemActive(item.routeName) ? 'primary' : undefined"
                class="[-webkit-text-stroke:0.35px_currentColor]"
                size="24"
              />
            </span>
            <span>{{ item.title }}</span>
          </RouterLink>
        </nav>
      </div>

      <div class="shrink-0 border-t border-[#eceef2] px-4 pb-4 pt-3">
        <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#848484]">
          Mon compte
        </p>
        <v-list
          nav
          density="default"
          class="space-y-1 bg-transparent pa-0 [&_.v-icon]:text-[25px] [&_.v-icon]:[-webkit-text-stroke:0.35px_currentColor] [&_.v-list-item]:min-h-[52px] [@media(max-height:820px)]:[&_.v-list-item]:min-h-11 [&_.v-list-item]:text-[15px] [&_.v-list-item]:font-medium [&_.v-list-item]:text-[#3f434d]"
        >
          <v-list-item
            prepend-icon="mdi-cog-outline"
            title="Paramètres"
            value="settings"
            :to="{ name: settingsRoute }"
            rounded="lg"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Se déconnecter"
            value="logout"
            rounded="lg"
            class="text-red-600"
            @click="handleLogout"
          />
        </v-list>
        <!-- Le nom figure déjà dans la barre du haut : sur un écran très peu haut, on rend la place au menu. -->
        <v-divider class="my-4 [@media(max-height:640px)]:hidden" />
        <div class="flex items-center gap-3 px-3 py-2 [@media(max-height:640px)]:hidden">
          <v-avatar color="primary" size="38"
            ><span class="text-xs font-bold text-white">{{ profile.initials }}</span></v-avatar
          >
          <div class="min-w-0">
            <p class="truncate text-xs font-bold text-[#292d38]">{{ profile.name }}</p>
            <p class="text-[10px] text-[#848484]">{{ profile.label }}</p>
            <p v-if="profile.company" class="truncate text-[10px] font-medium text-[#535865]">{{ profile.company }}</p>
          </div>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
</template>
