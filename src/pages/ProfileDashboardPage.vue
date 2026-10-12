<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const { activeRole, currentUser } = storeToRefs(authStore)

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
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader>
      <template #title>Bonjour {{ firstName }}</template>
      <template #description>{{ content.description }}</template>
      <template #actions><span /></template>
    </PageHeader>

    <AppSectionCard
      :title="content.title"
      description="Votre connexion et votre profil simulé ont été reconnus."
      :icon="content.icon"
    >
      <v-alert
        type="success"
        variant="tonal"
        title="Accès au profil confirmé"
        text="Les fonctionnalités métier de ce profil seront ajoutées dans les prochains sprints."
      />
    </AppSectionCard>
  </div>
</template>
