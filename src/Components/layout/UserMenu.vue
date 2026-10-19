<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { roleLabelByRole } from '@/types/roles'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const { activeRole, currentUser, tenant } = storeToRefs(authStore)

const profile = computed(() => {
  const name = currentUser.value?.names ?? 'Utilisateur'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const settingsRoutes = {
    operator: 'settings',
    administrator: 'admin-settings',
    supervisor: 'supervisor-settings',
    teamLeader: 'team-leader-settings',
  } as const

  return {
    initials,
    name,
    label: activeRole.value
      ? roleLabelByRole[activeRole.value]
      : 'Profil indisponible',
    company: tenant.value?.name ?? null,
    settingsRoute: activeRole.value
      ? settingsRoutes[activeRole.value]
      : 'settings',
  }
})

async function handleLogout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="ml-1 h-auto px-2 text-none"
      >
        <v-avatar
          color="primary"
          size="38"
          class="mr-3"
        >
          <span class="text-sm font-semibold text-white">
            {{ profile.initials }}
          </span>
        </v-avatar>

        <div class="hidden text-left sm:block">
          <p class="text-sm font-semibold text-gray-800">
            {{ profile.name }}
          </p>

          <p class="text-xs text-gray-500">
            {{ profile.label }}
          </p>

          <p v-if="profile.company" class="max-w-[220px] truncate text-xs font-medium text-gray-600">
            {{ profile.company }}
          </p>
        </div>

        <v-icon
          icon="mdi-chevron-down"
          size="small"
          class="ml-2"
        />
      </v-btn>
    </template>

    <v-card min-width="230">
      <v-list density="comfortable">
        <v-list-item
          prepend-icon="mdi-account-outline"
          title="Mon profil"
        />

        <v-list-item
          prepend-icon="mdi-cog-outline"
          title="Paramètres"
          :to="{ name: profile.settingsRoute }"
        />

        <v-divider class="my-2" />

        <v-list-item
          prepend-icon="mdi-logout"
          title="Se déconnecter"
          class="text-red-600"
          @click="handleLogout"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>
