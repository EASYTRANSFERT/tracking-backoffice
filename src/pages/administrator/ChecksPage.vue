<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import CheckScheduleDialog from '@/Components/checks/CheckScheduleDialog.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useCreateQuery } from '@/composables/useCreateQuery'
import { usePagination } from '@/composables/usePagination'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCheckStore } from '@/stores/check.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { apiCodeMessage, getApiErrorMessage } from '@/utils/api-error'
import { checkRefusals, describePeriod, describeSchedule } from '@/utils/check-schedule'
import type { Team } from '@/types/administrator'
import type { CheckScheduleResponse, CreateCheckScheduleRequest } from '@/types/check'

// Page partagée : l'administrateur vise toutes les équipes, le superviseur celles de ses sites.
const { activeRole } = storeToRefs(useAuthStore())
const isSupervisor = computed(() => activeRole.value === 'supervisor')
const store = useCheckStore()
const administratorStore = useAdministratorStore()
const supervisorStore = useSupervisorStore()
const feedback = useUiFeedbackStore()
const { schedules, isLoading, isSaving, togglingId } = storeToRefs(store)
const pagination = usePagination(schedules)

const teams = computed<Team[]>(() => isSupervisor.value
  ? supervisorStore.scopeTeams
  : administratorStore.knownTeams)
const teamName = (teamId: string) => (isSupervisor.value ? supervisorStore.teamsById[teamId] : administratorStore.findTeam(teamId))?.name ?? 'Équipe'
const teamsLabel = (teamIds: string[]) => teamIds.length ? teamIds.map(teamName).join(', ') : 'Toutes les équipes'
// « Toutes » : pour le superviseur, ses équipes seulement (vide vaudrait toute l'entreprise côté API).
const targetTeamIds = (teamIds: string[]) => teamIds.length || !isSupervisor.value ? teamIds : teams.value.map((team) => team.id)
const errorMessage = (error: unknown, fallback: string) => apiCodeMessage(error, checkRefusals) ?? getApiErrorMessage(error, fallback)

onMounted(async () => {
  if (isSupervisor.value) supervisorStore.loadScope().then(() => supervisorStore.loadScopeTeams()).catch(() => undefined)
  else administratorStore.loadTeamOptions().catch(() => undefined)
  try { await store.loadSchedules() }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les contrôles programmés.')) }
})

const dialog = ref(false)
const editing = ref<CheckScheduleResponse>()
function open(schedule?: CheckScheduleResponse) {
  editing.value = schedule
  dialog.value = true
}

async function save(payload: CreateCheckScheduleRequest) {
  const request = { ...payload, teamIds: targetTeamIds(payload.teamIds ?? []) }
  try {
    if (editing.value) await store.updateSchedule(editing.value.id, request)
    else await store.createSchedule(request)
    dialog.value = false
    feedback.success(editing.value ? 'Contrôle modifié.' : 'Contrôle programmé.')
  } catch (error) { feedback.error(errorMessage(error, 'Impossible d’enregistrer le contrôle.')) }
}

async function toggle(schedule: CheckScheduleResponse) {
  try { await store.setActive(schedule.id, !schedule.active) }
  catch (error) { feedback.error(errorMessage(error, 'Impossible de modifier ce contrôle.')) }
}

async function remove(schedule: CheckScheduleResponse) {
  const confirmed = await feedback.askConfirmation({ title: 'Supprimer ce contrôle ?', message: `« ${schedule.name} » ne sera plus lancé. Les contrôles déjà faits restent.`, confirmText: 'Supprimer', color: 'error' })
  if (!confirmed) return
  try {
    await store.removeSchedule(schedule.id)
    feedback.success('Contrôle supprimé.')
  } catch (error) { feedback.error(errorMessage(error, 'Impossible de supprimer ce contrôle.')) }
}
useCreateQuery(() => open())
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader>
      <template #title>Contrôles</template>
      <template #description>Contrôles de présence programmés, une fois ou de façon récurrente.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="open()">Nouveau contrôle</v-btn></template>
    </PageHeader>
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />
    <v-card class="overflow-hidden">
      <div v-if="schedules.length" class="overflow-x-auto">
        <v-table class="min-w-[640px]">
          <tbody>
            <tr v-for="schedule in pagination.displayed.value" :key="schedule.id" :class="{ 'opacity-60': !schedule.active }">
              <td class="py-4">
                <p class="font-semibold text-[#292d38]">{{ schedule.name }}</p>
                <p class="mt-1 text-xs text-[#747985]">{{ [describeSchedule(schedule), describePeriod(schedule)].filter(Boolean).join(' · ') }}</p>
              </td>
              <td class="text-sm text-[#535865]">{{ teamsLabel(schedule.teamIds) }}</td>
              <td class="w-16">
                <v-switch :model-value="schedule.active" color="primary" density="compact" hide-details inset :loading="togglingId === schedule.id" :aria-label="schedule.active ? 'Suspendre' : 'Réactiver'" @update:model-value="toggle(schedule)" />
              </td>
              <td class="w-12 text-right">
                <v-menu location="bottom end">
                  <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" aria-label="Actions" /></template>
                  <v-list density="compact" min-width="160">
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="open(schedule)" />
                    <v-list-item prepend-icon="mdi-delete-outline" title="Supprimer" base-color="error" @click="remove(schedule)" />
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
      <AppTableFooter v-if="schedules.length" v-model:page="pagination.page.value" :page-count="pagination.pageCount.value" :start="pagination.start.value + 1" :end="pagination.end.value" :total="pagination.total.value" label="contrôles" />
      <AppEmptyState v-else-if="!isLoading" icon="mdi-account-clock-outline" title="Aucun contrôle programmé" description="Programmez un contrôle pour une date précise, chaque jour ou à intervalle.">
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="open()">Nouveau contrôle</v-btn>
      </AppEmptyState>
    </v-card>
    <CheckScheduleDialog v-model="dialog" :teams="teams" :schedule="editing" :loading="isSaving" @submit="save" />
  </div>
</template>
