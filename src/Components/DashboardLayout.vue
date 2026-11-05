<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import { useColorMode } from '@/composables/useColorMode'
import { useProductTour } from '@/composables/useProductTour'
import AppSidebar from '@/Components/layout/AppSidebar.vue'
import AppTopbar from '@/Components/layout/AppTopbar.vue'
import OnboardingBar from '@/Components/onboarding/OnboardingBar.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

useColorMode().showStored()

const { lgAndUp } = useDisplay()
const drawer = ref(lgAndUp.value)
const auth = useAuthStore()
const operatorStore = useOperatorStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const route = useRoute()
const productTour = useProductTour()

// Visite guidée proposée à la première arrivée sur l'accueil du rôle (connexion, ou retour à l'accueil plus tard).
watch(() => route.name, productTour.startIfFirstVisit, { immediate: true })

onMounted(async () => {
  try {
    if (auth.activeRole === 'operator') await operatorStore.loadCatalog()
    // Le superviseur charge son propre périmètre (supervisor.store) depuis ses pages.
    if (auth.activeRole === 'administrator') {
      await Promise.all([
        administratorStore.loadDirectory(),
        administratorStore.loadMissions(),
      ])
    }
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les données du tableau de bord.'))
  }
})

watch(lgAndUp, (isDesktop) => {
  drawer.value = isDesktop
})
</script>

<template>
  <v-layout class="min-h-screen bg-background">
    <AppSidebar v-model="drawer" />
    <AppTopbar @toggle-navigation="drawer = !drawer" />

    <v-main class="bg-background">
      <v-container fluid class="pa-4 pa-md-8">
        <OnboardingBar />
        <RouterView />
      </v-container>
    </v-main>
  </v-layout>
</template>
