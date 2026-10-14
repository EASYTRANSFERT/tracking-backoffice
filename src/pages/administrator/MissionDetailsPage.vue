<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const route = useRoute()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const id = computed(() => route.params.missionId as string)
const mission = computed(() => store.getMissionById(id.value))
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
  : 'Non renseignée'

onMounted(async () => {
  if (mission.value) return
  try { await store.loadMission(id.value) }
  catch { feedback.error('Impossible de charger cette mission.') }
})

async function openMission() {
  if (!mission.value) return
  const confirmed = await feedback.askConfirmation({ title: 'Ouvrir cette mission ?', message: `La mission « ${mission.value.title} » passera au statut en cours.`, confirmText: 'Ouvrir' })
  if (!confirmed) return
  try { await store.openMission(mission.value.id); feedback.success('Mission ouverte.') }
  catch { feedback.error("Impossible d’ouvrir la mission.") }
}
async function closeMission() {
  if (!mission.value) return
  const confirmed = await feedback.askConfirmation({ title: 'Clôturer cette mission ?', message: `La mission « ${mission.value.title} » sera marquée comme terminée.`, confirmText: 'Clôturer' })
  if (!confirmed) return
  try { await store.closeMission(mission.value.id); feedback.success('Mission clôturée.') }
  catch { feedback.error('Impossible de clôturer la mission.') }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader><template #title>{{ mission?.title ?? 'Mission introuvable' }}</template><template #description>Informations et état d’exécution de la mission.</template><template #actions><v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-missions' }">Retour</v-btn><v-btn v-if="mission?.status === 'scheduled'" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-mission-edit', params: { missionId: mission.id } }">Modifier</v-btn></template></PageHeader>
    <v-alert v-if="!mission && !store.isMissionsLoading" type="error" variant="tonal" title="Mission introuvable" />
    <div v-else-if="mission" class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <v-card>
        <v-card-title class="flex items-center justify-between px-6 py-5"><span>Déroulement</span><AppStatusChip :status="mission.status" /></v-card-title>
        <v-divider />
        <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div><p class="text-xs text-[#848484]">Référence</p><p class="mt-1 font-medium">{{ mission.code }}</p></div>
          <div><p class="text-xs text-[#848484]">Créée le</p><p class="mt-1 font-medium">{{ formatDate(mission.createdAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Début prévisionnel</p><p class="mt-1 font-medium">{{ formatDate(mission.startAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Fin prévisionnelle</p><p class="mt-1 font-medium">{{ formatDate(mission.endAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Ouverte le</p><p class="mt-1 font-medium">{{ formatDate(mission.openedAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Clôturée le</p><p class="mt-1 font-medium">{{ formatDate(mission.closedAt) }}</p></div>
          <div class="sm:col-span-2"><p class="text-xs text-[#848484]">Description</p><p class="mt-1 text-sm leading-6">{{ mission.notes || 'Aucune description.' }}</p></div>
        </v-card-text>
      </v-card>
      <v-card class="h-fit">
        <v-card-title class="px-5 py-5">Actions</v-card-title><v-divider />
        <v-card-text class="text-sm leading-6 text-[#747985]">Le cycle de vie suit les transitions prévues par l’API : planifiée, en cours, puis terminée.</v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-btn v-if="mission.status === 'scheduled'" block variant="tonal" color="primary" prepend-icon="mdi-play-circle-outline" @click="openMission">Ouvrir la mission</v-btn>
          <v-btn v-else-if="mission.status === 'ongoing'" block variant="tonal" color="success" prepend-icon="mdi-check-circle-outline" @click="closeMission">Clôturer la mission</v-btn>
          <v-chip v-else color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">Mission terminée</v-chip>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>
