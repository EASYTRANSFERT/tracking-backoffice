<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAdministratorStore } from '@/stores/administrator.store'

const authStore = useAuthStore()
const directoryStore = useAdministratorStore()
const { activeRole, currentUser } = storeToRefs(authStore)
const { users, teams, pendingDeviceActivationsCount } = storeToRefs(directoryStore)

const firstName = computed(() => {
  return currentUser.value?.names.split(/\s+/)[0] ?? 'Utilisateur'
})

const content = computed(() => {
  if (activeRole.value === 'supervisor') {
    return {
      title: 'Espace superviseur',
      description:
        'La navigation est limitée au suivi et à la validation des missions autorisées.',
      icon: 'mdi-account-tie-outline',
    }
  }

  return {
    title: "Espace chef d'équipe",
    description:
      "La navigation est limitée aux missions et aux agents de l'équipe autorisée.",
    icon: 'mdi-account-group-outline',
  }
})

const routes = computed(() => activeRole.value === 'supervisor'
  ? { users: 'supervisor-users', teams: 'supervisor-teams' }
  : { users: 'team-leader-users', teams: 'team-leader-teams' })
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader>
      <template #title>Bonjour {{ firstName }}</template>
      <template #description>{{ content.description }}</template>
      <template #actions><span /></template>
    </PageHeader>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <DashboardStatCard title="Utilisateurs affichés" :value="users.length" icon="mdi-account-group-outline" change="Page API chargée" />
      <DashboardStatCard title="Équipes affichées" :value="teams.length" icon="mdi-account-multiple-outline" change="Page API chargée" />
      <DashboardStatCard title="Comptes en activation" :value="pendingDeviceActivationsCount" icon="mdi-cellphone-clock" change="Page API chargée" change-color="warning" />
    </div>

    <AppSectionCard
      :title="content.title"
      description="Les listes sont limitées automatiquement au périmètre autorisé par l’API."
      :icon="content.icon"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-group-outline" :to="{ name: routes.users }">Consulter les utilisateurs</v-btn>
        <v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-multiple-outline" :to="{ name: routes.teams }">Consulter les équipes</v-btn>
      </div>
    </AppSectionCard>
  </div>
</template>
