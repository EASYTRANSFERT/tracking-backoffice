<script setup lang="ts">
import { nameOr } from '@/utils/people'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionSiteAttachDialog from '@/Components/missions/MissionSiteAttachDialog.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const route = useRoute()
const router = useRouter()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const id = computed(() => route.params.missionId as string)
const mission = computed(() => store.getMissionById(id.value))
// Côté API, c'est le site qui porte sa mission (site.missionId) : une mission peut avoir plusieurs sites.
const missionSites = computed(() => mission.value ? store.getMissionSites(mission.value.id) : [])
const isSitesLoading = ref(false)
// L'API refuse d'ajouter un site à une mission terminée ou annulée (MISSION_STATUS_CONFLICT).
const canAddSite = computed(() => mission.value?.status === 'scheduled' || mission.value?.status === 'ongoing')
const teamName = (teamId?: string) => {
  const team = teamId ? store.teamOptions.find((item) => item.id === teamId) ?? store.getTeamById(teamId) : undefined
  return team?.name ?? (teamId ? 'Équipe' : 'Aucune équipe')
}
const memberCount = (teamId?: string) => {
  if (!teamId) return '—'
  const count = store.teamMemberCounts[teamId]
  return count === undefined ? '…' : `${count} agent${count > 1 ? 's' : ''}`
}
const managerName = (managerId?: string) => {
  const user = managerId ? store.teamDirectoryUsers.find((item) => item.id === managerId) : undefined
  return nameOr(user)
}
const openSite = (siteId: string) => router.push({ name: 'admin-site-details', params: { siteId } })
const createSite = () => mission.value && router.push({ name: 'admin-site-create', query: { missionId: mission.value.id } })

const attachDialog = ref(false)
const isAttachLoading = ref(false)
const isAttaching = ref(false)

async function openAttachDialog() {
  attachDialog.value = true
  isAttachLoading.value = true
  // Liste complète des sites, pour proposer tous ceux qui n'ont pas encore de mission.
  try { await store.loadSites(true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sites.')) }
  finally { isAttachLoading.value = false }
}

async function attachSites(siteIds: string[]) {
  if (!mission.value) return
  isAttaching.value = true
  try {
    await store.attachSitesToMission(mission.value.id, siteIds)
    attachDialog.value = false
    feedback.success(siteIds.length > 1 ? `${siteIds.length} sites attribués à la mission.` : 'Site attribué à la mission.')
    void loadSites(mission.value.id)
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’attribuer ce site à la mission.'))
    void loadSites(mission.value.id)
  } finally { isAttaching.value = false }
}

async function loadSites(missionId: string) {
  isSitesLoading.value = true
  try { await store.loadMissionSites(missionId) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sites de cette mission.')) }
  finally { isSitesLoading.value = false }
}
watch(id, (missionId) => { void loadSites(missionId) })
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
  : 'Non renseignée'

onMounted(async () => {
  void loadSites(id.value)
  store.loadTeamOptions().catch(() => undefined)
  store.loadDirectory().catch(() => undefined)
  if (mission.value) return
  try { await store.loadMission(id.value) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger cette mission.')) }
})

async function openMission() {
  if (!mission.value) return
  const confirmed = await feedback.askConfirmation({ title: 'Ouvrir cette mission ?', message: `La mission « ${mission.value.title} » passera au statut en cours.`, confirmText: 'Ouvrir' })
  if (!confirmed) return
  try { await store.openMission(mission.value.id); feedback.success('Mission ouverte.') }
  catch (error) { feedback.error(getApiErrorMessage(error, "Impossible d’ouvrir la mission.")) }
}
async function closeMission() {
  if (!mission.value) return
  const confirmed = await feedback.askConfirmation({ title: 'Clôturer cette mission ?', message: `La mission « ${mission.value.title} » sera marquée comme terminée.`, confirmText: 'Clôturer' })
  if (!confirmed) return
  try { await store.closeMission(mission.value.id); feedback.success('Mission clôturée.') }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de clôturer la mission.')) }
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
              <div><h2 class="text-base font-bold">Sites d’intervention</h2><p class="mt-1 text-xs font-normal text-[#747985]">{{ missionSites.length }} site{{ missionSites.length > 1 ? 's' : '' }} rattaché{{ missionSites.length > 1 ? 's' : '' }} à cette mission</p></div>
            </div>
            <div v-if="canAddSite" class="flex flex-wrap justify-end gap-2">
              <v-btn variant="outlined" color="primary" size="small" prepend-icon="mdi-link-variant-plus" @click="openAttachDialog">Attribuer un site</v-btn>
              <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-map-marker-plus-outline" @click="createSite">Nouveau site</v-btn>
            </div>
          </v-card-title>
          <v-divider />
          <v-progress-linear v-if="isSitesLoading" indeterminate color="primary" />
          <div v-if="missionSites.length" class="overflow-x-auto">
            <v-table hover class="min-w-[640px]">
              <thead><tr><th>Site</th><th>Équipe</th><th>Agents</th><th>Responsable</th><th>Statut</th></tr></thead>
              <tbody>
                <tr v-for="site in missionSites" :key="site.id" class="cursor-pointer" @click="openSite(site.id)">
                  <td><p class="font-semibold text-[#292d38]">{{ site.name }}</p><p class="text-xs text-[#848484]">{{ [site.address, site.city].filter(Boolean).join(', ') || 'Adresse à compléter' }}</p></td>
                  <td class="text-sm text-[#535865]">{{ teamName(site.teamId) }}</td>
                  <td class="text-sm text-[#535865]">{{ memberCount(site.teamId) }}</td>
                  <td class="text-sm text-[#535865]">{{ managerName(site.managerId) }}</td>
                  <td><AppStatusChip :status="site.status" /></td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <v-card-text v-else-if="!isSitesLoading" class="px-6 py-7 text-center">
            <v-icon icon="mdi-map-marker-question-outline" color="secondary" size="42" />
            <p class="mt-3 font-semibold text-[#292d38]">Aucun site pour cette mission</p>
            <p class="mt-1 text-sm text-[#747985]">{{ canAddSite ? 'Attribuez un site existant ou créez-en un : chacun a son périmètre, son équipe et son QR code.' : 'Cette mission est terminée : aucun site ne peut plus y être ajouté.' }}</p>
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


    <MissionSiteAttachDialog v-model="attachDialog" :sites="store.sitesWithoutMission" :loading="isAttachLoading" :saving="isAttaching" @confirm="attachSites" />
  </div>
</template>
