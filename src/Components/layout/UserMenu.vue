<script setup lang="ts">
import { computed } from 'vue'
import type { UserRole } from '@/types/roles'

const props = withDefaults(defineProps<{ role?: UserRole }>(), { role: 'operator' })
const profile = computed(() => props.role === 'administrator'
  ? { initials: 'AK', name: 'Aïcha Koné', label: 'Administratrice entreprise', settingsRoute: 'admin-settings' }
  : { initials: 'JD', name: 'Jean Djezou', label: 'Opérateur KAYBIC', settingsRoute: 'settings' })
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
          :to="{ name: 'login' }"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>
