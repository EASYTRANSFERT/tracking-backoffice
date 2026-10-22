<script setup lang="ts">
import { computed } from 'vue'

import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const isAdministrator = computed(() => authStore.activeRole === 'administrator')
</script>

<template>
  <div class="mx-auto w-full max-w-[900px]">
    <PageHeader>
      <template #title>Paramètres</template>
      <template #description>Préférences personnelles de votre espace de travail.</template>
      <template #actions><span /></template>
    </PageHeader>
    <v-card>
      <v-list lines="two">
        <v-list-item prepend-icon="mdi-lock-reset" title="Changer le mot de passe" subtitle="Modifiez le mot de passe utilisé pour vous connecter." :to="{ name: 'change-password' }">
          <template #append><v-icon icon="mdi-chevron-right" /></template>
        </v-list-item>
        <template v-if="isAdministrator">
          <v-divider />
          <v-list-item prepend-icon="mdi-domain" title="Paramètres de l’entreprise" subtitle="Rayon, tolérance de retard, contrôles de présence et conservation des données." :to="{ name: 'admin-company-settings' }">
            <template #append><v-icon icon="mdi-chevron-right" /></template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </div>
</template>
