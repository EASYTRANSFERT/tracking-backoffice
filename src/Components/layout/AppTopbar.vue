<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import ColorModeToggle from '@/Components/common/ColorModeToggle.vue'
import UserMenu from '@/Components/layout/UserMenu.vue'
import { useAuthStore } from '@/stores/auth.store'
import { dashboardRouteByRole } from '@/types/roles'

const emit = defineEmits<{
  toggleNavigation: []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { activeRole } = storeToRefs(authStore)
const pageTitle = computed(() => String(route.meta.title ?? 'Dashboard'))

function goBack() {
  if (window.history.state.back) {
    router.back()
    return
  }

  if (activeRole.value) {
    void router.push({ name: dashboardRouteByRole[activeRole.value] })
  }
}
</script>

<template>
  <v-app-bar
    app
    flat
    height="72"
    color="surface"
    class="border-b-sm"
  >
    <v-app-bar-nav-icon
      aria-label="Afficher ou masquer le menu"
      data-tour="menu-toggle"
      class="ml-1"
      @click="emit('toggleNavigation')"
    />

    <v-btn
      icon="mdi-arrow-left"
      variant="text"
      aria-label="Revenir à la page précédente"
      title="Retour"
      @click="goBack"
    />

    <!-- Sur téléphone, le titre de la page est déjà dans son en-tête : la barre garde la place pour le menu et le compte. -->
    <v-toolbar-title class="ml-1 hidden text-[22px] font-bold text-[#252830] sm:block md:ml-4">
      {{ pageTitle }}
    </v-toolbar-title>

    <v-spacer />

    <!--<v-text-field
      prepend-inner-icon="mdi-magnify"
      placeholder="Rechercher"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mr-3 hidden max-w-[320px] md:block"
    />

    <v-btn
      icon="mdi-bell-outline"
      variant="text"
      color="secondary"
      aria-label="Notifications"
    />-->

    <ColorModeToggle data-tour="color-mode" />

    <UserMenu />

    <div class="mr-3" />
  </v-app-bar>
</template>
