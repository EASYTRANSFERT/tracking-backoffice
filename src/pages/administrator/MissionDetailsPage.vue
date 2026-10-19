<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionSiteAssignmentDialog from '@/Components/missions/MissionSiteAssignmentDialog.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const route = useRoute()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const id = computed(() => route.params.missionId as string)
const mission = computed(() => store.getMissionById(id.value))
// Côté API, c'est le site qui porte sa mission (site.missionId).
const site = computed(() => mission.value?.siteId ? store.getSiteById(mission.value.siteId) : store.sites.find((item) => item.missionId === mission.value?.id))
const supervisor = computed(() => site.value?.managerId ? store.getUserById(site.value.managerId) : undefined)
const siteDialog = ref(false)
const selectedSiteId = ref<string>()
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
  : 'Non renseignée'

onMounted(async () => {
  store.loadSites().catch(() => undefined)
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

function openSiteDialog() {
  selectedSiteId.value = mission.value?.siteId
  siteDialog.value = true
}

function assignSite() {
  if (!mission.value || !selectedSiteId.value) return
  store.assignMissionSite(mission.value.id, selectedSiteId.value)
  siteDialog.value = false
  feedback.success('Site affecté à la mission.')
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader><template #title>{{ mission?.title ?? 'Mission introuvable' }}</template><template #description>Informations et état d’exécution de la mission.</template><template #actions><v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-missions' }">Retour</v-btn><v-btn v-if="mission?.status === 'scheduled'" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-mission-edit', params: { missionId: mission.id } }">Modifier</v-btn></template></PageHeader>
    <v-alert v-if="!mission && !store.isMissionsLoading" type="error" variant="tonal" title="Mission introuvable" />
    <div v-else-if="mission" class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div class="space-y-6">
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

        <v-card>
          <v-card-title class="flex items-center justify-between gap-3 px-6 py-5">
            <div class="flex items-center gap-3">
              <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-radius-outline" color="primary" /></v-avatar>
              <div><h2 class="text-base font-bold">Site d’intervention</h2><p class="mt-1 text-xs font-normal text-[#747985]">Périmètre et encadrement utilisés par la mission</p></div>
            </div>
            <v-btn v-if="mission.status === 'scheduled'" variant="tonal" color="primary" size="small" :prepend-icon="site ? 'mdi-map-marker-edit-outline' : 'mdi-map-marker-plus-outline'" @click="openSiteDialog">
              {{ site ? 'Changer' : 'Affecter un site' }}
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text v-if="site" class="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div><p class="text-xs text-[#848484]">Site</p><p class="mt-1 font-semibold">{{ site.name }}</p></div>
            <div><p class="text-xs text-[#848484]">Superviseur</p><p class="mt-1 font-semibold">{{ supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : 'Non affecté' }}</p></div>
            <div><p class="text-xs text-[#848484]">Adresse</p><p class="mt-1 font-medium">{{ [site.address, site.city].filter(Boolean).join(', ') || 'À compléter' }}</p></div>
            <div><p class="text-xs text-[#848484]">Périmètre</p><p class="mt-1 font-medium">{{ site.radiusM ? `${site.radiusM} mètres` : 'À compléter' }}</p></div>
          </v-card-text>
          <v-card-text v-else class="px-6 py-7 text-center">
            <v-icon icon="mdi-map-marker-question-outline" color="secondary" size="42" />
            <p class="mt-3 font-semibold text-[#292d38]">Aucun site affecté</p>
            <p class="mt-1 text-sm text-[#747985]">Choisissez le site qui fournit le périmètre et le superviseur de cette mission.</p>
          </v-card-text>
        </v-card>
      </div>
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

    <MissionSiteAssignmentDialog
      v-model="siteDialog"
      v-model:selected-site-id="selectedSiteId"
      :sites="store.sites"
      :users="store.teamDirectoryUsers"
      @confirm="assignSite"
    />
  </div>
</template>
