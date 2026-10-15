<script setup lang="ts">
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { EnterpriseUser, Mission, Site, Team } from '@/types/administrator'

defineProps<{
  mission: Mission
  site?: Site
  team?: Team
  supervisor?: EnterpriseUser
}>()

function formatDate(value?: string) {
  if (!value) return 'Non renseignée'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function fullName(user?: EnterpriseUser) {
  return user ? `${user.firstName} ${user.lastName}` : 'Non renseigné'
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
    <v-card>
      <v-card-title class="flex items-center justify-between px-6 py-5">
        <span>Informations de la mission</span>
        <AppStatusChip :status="mission.status" />
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-2">
        <div><p class="text-xs text-[#848484]">Référence</p><p class="mt-1 font-semibold">{{ mission.code }}</p></div>
        <div><p class="text-xs text-[#848484]">Intitulé</p><p class="mt-1 font-semibold">{{ mission.title }}</p></div>
        <div><p class="text-xs text-[#848484]">Début prévisionnel</p><p class="mt-1 font-medium">{{ formatDate(mission.startAt) }}</p></div>
        <div><p class="text-xs text-[#848484]">Fin prévisionnelle</p><p class="mt-1 font-medium">{{ formatDate(mission.endAt) }}</p></div>
        <div><p class="text-xs text-[#848484]">Ouverte le</p><p class="mt-1 font-medium">{{ formatDate(mission.openedAt) }}</p></div>
        <div><p class="text-xs text-[#848484]">Clôturée le</p><p class="mt-1 font-medium">{{ formatDate(mission.closedAt) }}</p></div>
        <div class="sm:col-span-2">
          <p class="text-xs text-[#848484]">Description</p>
          <p class="mt-1 text-sm leading-6">{{ mission.notes || 'Aucune description.' }}</p>
        </div>
      </v-card-text>
    </v-card>

    <div class="space-y-6">
      <v-card>
        <v-card-title class="px-6 py-5">Affectation</v-card-title>
        <v-divider />
        <v-card-text class="space-y-5 px-6 py-6">
          <div><p class="text-xs text-[#848484]">Site</p><p class="mt-1 font-semibold">{{ site?.name ?? 'Non renseigné' }}</p></div>
          <div><p class="text-xs text-[#848484]">Adresse</p><p class="mt-1 text-sm">{{ site?.address ?? site?.city ?? 'Non renseignée' }}</p></div>
          <div><p class="text-xs text-[#848484]">Équipe</p><p class="mt-1 font-semibold">{{ team?.name ?? 'Non renseignée' }}</p></div>
          <div><p class="text-xs text-[#848484]">Superviseur</p><p class="mt-1 font-semibold">{{ fullName(supervisor) }}</p></div>
        </v-card-text>
      </v-card>

      <v-alert
        type="info"
        variant="tonal"
        title="Consultation en lecture seule"
        text="Les informations affichées correspondent au périmètre autorisé par votre profil."
      />
    </div>
  </div>
</template>
