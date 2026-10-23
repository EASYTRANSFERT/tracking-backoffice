<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import QrCodeCard from '@/Components/sites/QrCodeCard.vue'
import { formatCoordinates } from '@/Components/sites/site-map'
import SiteGovernanceCard from '@/Components/sites/SiteGovernanceCard.vue'
import SitePerimeterMap from '@/Components/sites/SitePerimeterMap.vue'
import SiteScheduleCard from '@/Components/sites/SiteScheduleCard.vue'
import { useSiteQrCode } from '@/composables/useSiteQrCode'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { EnterpriseUser, Team } from '@/types/administrator'

const route = useRoute()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { generatingId, generate } = useSiteQrCode()
const loading = ref(true)
const archiving = ref(false)
const site = computed(() => store.getSiteById(route.params.siteId as string))
const mission = computed(() => site.value?.missionId ? store.getMissionById(site.value.missionId) : undefined)

onMounted(async () => {
  try {
    await Promise.all([store.loadSite(route.params.siteId as string), store.loadDirectory(), store.loadMissions()])
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger ce site.'))
  } finally {
    loading.value = false
  }
})

async function archive() {
  if (!site.value) return
  const confirmed = await feedback.askConfirmation({ title: 'Archiver ce site ?', message: `Le site « ${site.value.name} » ne pourra plus être modifié ni recevoir de pointage.`, confirmText: 'Archiver', color: 'error' })
  if (!confirmed) return
  archiving.value = true
  try {
    await store.archiveSite(site.value.id)
    feedback.success('Site archivé.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’archiver le site.'))
  } finally {
    archiving.value = false
  }
}
const supervisor = computed(() => site.value?.managerId
  ? store.teamDirectoryUsers.find((user) => user.id === site.value?.managerId)
  : undefined)

// Pas encore d’endpoint pour désigner un chef d'équipe sur un site.
const projectLead = computed<EnterpriseUser | undefined>(() => undefined)
const team = ref<Team>()
watch(() => site.value?.teamId, async (teamId) => {
  team.value = undefined
  if (!teamId) return
  try { team.value = await store.loadTeam(teamId) } catch { team.value = undefined }
}, { immediate: true })
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px]">
    <PageHeader>
      <template #title>{{ site?.name ?? 'Site introuvable' }}</template>
      <template #description>Configuration, périmètre, encadrement et personnel affecté.</template>
      <template #actions>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-sites' }">Retour</v-btn>
        <v-btn v-if="site && site.status !== 'inactive'" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-site-edit', params: { siteId: site.id } }">Modifier</v-btn>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading && !site" indeterminate color="primary" />
    <v-alert v-else-if="!site" type="error" variant="tonal" title="Site introuvable" />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <v-card>
          <v-card-title class="flex items-center justify-between px-6 py-5">
            <div class="flex items-center gap-3">
              <v-avatar color="red-lighten-5" rounded="lg">
                <v-icon icon="mdi-office-building-marker-outline" color="primary" />
              </v-avatar>
              <div>
                <h2 class="text-base font-bold">Informations du site</h2>
                <p class="mt-1 text-xs font-normal text-[#747985]">Identité et localisation</p>
              </div>
            </div>
            <AppStatusChip :status="site.status" />
          </v-card-title>
          <v-divider />
          <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div><p class="text-xs text-[#848484]">Nom</p><p class="mt-1 font-medium">{{ site.name }}</p></div>
            <div><p class="text-xs text-[#848484]">Ville</p><p class="mt-1 font-medium">{{ site.city || 'À compléter' }}</p></div>
            <div class="sm:col-span-2"><p class="text-xs text-[#848484]">Adresse</p><p class="mt-1 font-medium">{{ site.address || 'À compléter' }}</p></div>
            <div class="sm:col-span-2"><p class="text-xs text-[#848484]">Description de l’emplacement</p><p class="mt-1 font-medium">{{ site.locationDescription || '—' }}</p></div>
            <div><p class="text-xs text-[#848484]">Équipe</p><p class="mt-1 font-medium">{{ team?.name ?? (site.teamId ? '…' : 'Aucune équipe affectée') }}</p></div>
            <div><p class="text-xs text-[#848484]">Mission</p><p class="mt-1 font-medium">{{ mission ? `${mission.code} · ${mission.title}` : site.missionId || 'Aucune mission' }}</p></div>
          </v-card-text>
          <v-divider />
          <v-card-actions v-if="site.status !== 'inactive'" class="px-6 py-4">
            <v-btn variant="tonal" color="error" prepend-icon="mdi-archive-outline" :loading="archiving" @click="archive">Archiver le site</v-btn>
          </v-card-actions>
        </v-card>

        <v-card>
          <v-card-title class="flex items-center gap-3 px-6 py-5">
            <v-avatar color="red-lighten-5" rounded="lg">
              <v-icon icon="mdi-crosshairs-gps" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-base font-bold">Périmètre autorisé</h2>
              <p class="mt-1 text-xs font-normal text-[#747985]">Zone géographique de présence et de pointage</p>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="px-6 pt-6 pb-0">
            <SitePerimeterMap :points="site.points ?? []" empty-text="Aucun contour enregistré pour ce site." />
          </v-card-text>
          <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-3">
            <div class="sm:col-span-2">
              <p class="text-xs text-[#848484]">Contour ({{ site.points?.length ?? 0 }} points)</p>
              <ol v-if="site.points?.length" class="mt-1 space-y-1 text-sm font-medium">
                <li v-for="(point, index) in site.points" :key="index">{{ index + 1 }}. {{ point.address || formatCoordinates(point) }}</li>
              </ol>
              <p v-else class="mt-1 font-medium">À compléter</p>
            </div>
            <div><p class="text-xs text-[#848484]">Tolérance GPS</p><p class="mt-1 font-medium">{{ site.radiusM ? `${site.radiusM} mètres` : 'À compléter' }}</p></div>
          </v-card-text>
          <v-divider />
          <v-card-text class="px-6 py-4">
            <div class="flex items-center gap-3 rounded-xl bg-[#f6f6f7] px-4 py-4">
              <v-icon icon="mdi-map-marker-radius-outline" color="primary" size="28" />
              <div><p class="text-sm font-semibold">Zone de contrôle</p><p class="mt-1 text-xs text-[#747985]">Les contrôles de présence s’appliqueront à l’intérieur du contour, avec la tolérance GPS autour.</p></div>
            </div>
          </v-card-text>
        </v-card>

      </div>

      <div class="space-y-6">
        <SiteGovernanceCard :supervisor="supervisor" :project-lead="projectLead" />
        <QrCodeCard :site="site" :loading="generatingId === site.id" @details="() => {}" @regenerate="generate" />
      </div>
    </div>
    <SiteScheduleCard v-if="site" :site="site" :team="team" class="mt-6" />
  </div>
</template>
