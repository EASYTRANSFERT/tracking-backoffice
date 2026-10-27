<script setup lang="ts">
import { fullName } from '@/utils/people'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import AttendanceTable from '@/Components/attendance/AttendanceTable.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const route = useRoute()
const store = useSupervisorStore()
const feedback = useUiFeedbackStore()
const { isLoading, hasLoaded, teamsById, members, isMembersLoading } = storeToRefs(store)

const missionId = computed(() => String(route.params.missionId))
const mission = computed(() => store.getMissionById(missionId.value))
// Seuls les sites du périmètre du superviseur : une mission peut en avoir d'autres.
const sites = computed(() => store.getMissionSites(missionId.value))
const selectedSiteId = ref<string>()
const site = computed(() => sites.value.find((item) => item.id === selectedSiteId.value) ?? sites.value[0])
const team = computed(() => site.value?.teamId ? teamsById.value[site.value.teamId] : undefined)
const leader = computed(() => members.value.find((member) => member.id === team.value?.leadUserId))

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Non renseignée'

async function load() {
  try {
    await store.loadScope()
    if (!mission.value) return
    await store.loadMissionTeams(missionId.value)
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les équipes de cette mission.'))
  }
}
watch(missionId, () => { selectedSiteId.value = undefined; void load() }, { immediate: true })
watch(() => site.value?.teamId, (teamId) => {
  store.loadTeamMembers(teamId).catch((error) => feedback.error(getApiErrorMessage(error, 'Impossible de charger les agents de ce site.')))
}, { immediate: true })
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px]">
    <PageHeader>
      <template #title>{{ mission?.title ?? 'Détail de la mission' }}</template>
      <template #description>Sites de votre périmètre, leurs équipes, leurs agents et leurs pointages.</template>
      <template #actions><v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'supervisor-missions' }">Retour aux missions</v-btn></template>
    </PageHeader>

    <v-progress-linear v-if="isLoading && !hasLoaded" indeterminate color="primary" />
    <v-alert v-else-if="!mission" type="warning" variant="tonal" title="Mission indisponible" text="Cette mission n’existe pas ou ne fait pas partie de votre périmètre." />

    <div v-else class="space-y-6">
      <v-card>
        <v-card-title class="flex items-center justify-between px-6 py-5"><span>Informations de la mission</span><AppStatusChip :status="mission.status" /></v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-8 gap-y-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><p class="text-xs text-[#848484]">Référence</p><p class="mt-1 font-semibold">{{ mission.code }}</p></div>
          <div><p class="text-xs text-[#848484]">Début prévisionnel</p><p class="mt-1 font-medium">{{ formatDate(mission.startAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Fin prévisionnelle</p><p class="mt-1 font-medium">{{ formatDate(mission.endAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Mes sites</p><p class="mt-1 font-medium">{{ sites.length }}</p></div>
          <div class="sm:col-span-2 lg:col-span-4"><p class="text-xs text-[#848484]">Description</p><p class="mt-1 text-sm leading-6">{{ mission.notes || 'Aucune description.' }}</p></div>
        </v-card-text>
      </v-card>

      <v-card v-if="!sites.length"><AppEmptyState icon="mdi-map-marker-off-outline" title="Aucun site" description="Aucun site de cette mission ne vous est encore visible." /></v-card>

      <template v-else-if="site">
        <v-tabs v-if="sites.length > 1" :model-value="site.id" color="primary" show-arrows @update:model-value="selectedSiteId = String($event)">
          <v-tab v-for="item in sites" :key="item.id" :value="item.id" prepend-icon="mdi-map-marker-outline" class="normal-case">{{ item.name }}</v-tab>
        </v-tabs>

        <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <v-card>
            <v-card-title class="flex items-center gap-3 px-6 py-5">
              <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-radius-outline" color="primary" /></v-avatar>
              <div class="min-w-0"><h2 class="truncate text-base font-bold">{{ site.name }}</h2><p class="mt-1 text-xs font-normal text-[#747985]">{{ [site.address, site.city].filter(Boolean).join(', ') || site.locationDescription || 'Adresse non renseignée' }}</p></div>
              <v-spacer /><AppStatusChip :status="site.status" />
            </v-card-title>
            <v-divider />
            <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
              <div><p class="text-xs text-[#848484]">Zone autorisée</p><p class="mt-1 font-medium">{{ site.radiusM ? `${site.radiusM} m autour du périmètre` : 'Non renseignée' }}</p></div>
              <div><p class="text-xs text-[#848484]">Équipe</p><p class="mt-1 font-semibold">{{ site.teamId ? team?.name ?? '…' : 'Aucune équipe affectée' }}</p></div>
              <div><p class="text-xs text-[#848484]">Chef d’équipe</p><p class="mt-1 font-semibold">{{ leader ? fullName(leader) : site.teamId ? 'Non désigné' : '—' }}</p></div>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title class="flex items-center gap-3 px-6 py-5">
              <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-group-outline" color="primary" /></v-avatar>
              <div><h2 class="text-base font-bold">Agents</h2><p class="mt-1 text-xs font-normal text-[#747985]">{{ site.teamId ? `${members.length} membre${members.length > 1 ? 's' : ''} de l’équipe` : 'Aucune équipe sur ce site' }}</p></div>
            </v-card-title>
            <v-divider />
            <v-progress-linear v-if="isMembersLoading" indeterminate color="primary" height="2" />
            <div v-if="members.length" class="max-h-[340px] overflow-y-auto">
              <v-table density="comfortable">
                <thead><tr><th>Agent</th><th>Matricule</th><th>Téléphone</th></tr></thead>
                <tbody>
                  <tr v-for="member in members" :key="member.id">
                    <td><div class="flex items-center gap-2 py-2"><span class="font-semibold text-[#292d38]">{{ member.firstName }} {{ member.lastName }}</span><v-chip v-if="member.id === team?.leadUserId || member.role === 'teamLeader'" size="x-small" color="primary" variant="tonal">Chef d’équipe</v-chip></div></td>
                    <td class="text-sm text-[#535865]">{{ member.employeeNumber || '—' }}</td>
                    <td class="text-sm text-[#535865]"><a v-if="member.phone" :href="`tel:${member.phone}`" class="hover:text-[#D80F16]">{{ member.phone }}</a><span v-else>—</span></td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            <v-card-text v-else-if="!isMembersLoading" class="px-6 py-8 text-center text-sm text-[#747985]">{{ site.teamId ? 'L’équipe n’a pas encore d’agent.' : 'L’administrateur doit affecter une équipe à ce site.' }}</v-card-text>
          </v-card>
        </div>
      </template>
      <AttendanceTable v-if="sites.length" :sites="sites" can-decide />
    </div>
  </div>
</template>
