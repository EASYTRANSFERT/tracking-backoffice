<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useDisplay } from 'vuetify'

import AppSidebar from '@/Components/layout/AppSidebar.vue'
import AppTopbar from '@/Components/layout/AppTopbar.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const { lgAndUp } = useDisplay()
const drawer = ref(lgAndUp.value)
const auth = useAuthStore()
const operatorStore = useOperatorStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()

onMounted(async () => {
  try {
    if (auth.activeRole === 'operator') await operatorStore.loadCatalog()
    if (auth.activeRole === 'administrator') await administratorStore.loadDirectory()
  } catch {
    feedback.error('Impossible de charger les données du tableau de bord.')
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
        <RouterView />
      </v-container>
    </v-main>
  </v-layout>
</template>
