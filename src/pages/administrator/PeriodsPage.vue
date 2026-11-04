<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import PeriodCreateDialog from '@/Components/periods/PeriodCreateDialog.vue'
import PeriodTable from '@/Components/periods/PeriodTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useCreateQuery } from '@/composables/useCreateQuery'
import { usePeriodAccess } from '@/composables/usePeriodAccess'
import { usePeriodStore } from '@/stores/period.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { periodErrorMessage, periodsOfTeams, periodStateOptions } from '@/utils/period-format'
import type { ApiPeriodState, PeriodResponse } from '@/types/period'

const router = useRouter()
const store = usePeriodStore()
const { readonly, detailsRoute } = usePeriodAccess()
const administratorStore = useAdministratorStore()
const supervisorStore = useSupervisorStore()
const { knownTeams } = storeToRefs(administratorStore)
const feedback = useUiFeedbackStore()
const { periods, isLoading, isSaving } = storeToRefs(store)

const state = ref<ApiPeriodState | null>(null)
// L'administrateur voit toutes les périodes ; le superviseur, celles des équipes de ses sites.
const visiblePeriods = computed(() => readonly.value ? periodsOfTeams(periods.value, supervisorStore.scopeTeamIds) : periods.value)
// Équipes proposées à la création : celles du périmètre pour le superviseur.
const creatableTeams = computed(() => readonly.value ? supervisorStore.scopeTeams : knownTeams.value)
const teamName = (teamId?: string) => (readonly.value ? supervisorStore.teamsById[teamId ?? '']?.name : administratorStore.findTeam(teamId)?.name) ?? '—'
const filtered = computed(() => visiblePeriods.value.filter((period) => !state.value || period.state === state.value))
const createOpen = ref(false)
const createError = ref<string | null>(null)
const createTeamIds = ref<string[]>([])

onMounted(async () => {
  if (readonly.value) supervisorStore.loadScope().then(() => supervisorStore.loadScopeTeams()).catch(() => undefined)
  else administratorStore.loadTeamOptions().catch(() => undefined)
  try { await store.loadPeriods(true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les périodes.')) }
})

const view = (period: PeriodResponse) => router.push({ name: detailsRoute.value, params: { periodId: period.id } })

function openCreate() {
  createError.value = null
  createTeamIds.value = []
  createOpen.value = true
}

async function create(teamIds: string[], from: string, to: string) {
  createError.value = null
  const { created, failed } = await store.createPeriods(teamIds, from, to)
  if (created.length) feedback.success(created.length > 1 ? `${created.length} périodes créées.` : 'Période créée.')
  if (!failed.length) {
    createOpen.value = false
    if (created.length === 1) void view(created[0]!)
    return
  }
  // Les équipes refusées restent choisies : on corrige puis on réessaie, sans recréer les autres.
  createTeamIds.value = failed.map(({ teamId }) => teamId)
  createError.value = failed.map(({ teamId, error }) => `${teamName(teamId)} : ${periodErrorMessage(error) ?? getApiErrorMessage(error, 'Impossible de créer la période.')}`).join('\n')
}
useCreateQuery(openCreate)
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Périodes</template>
      <template #description>{{ readonly ? 'Créez et consultez les périodes de validation des équipes de vos sites.' : 'Validez les pointages d’une période, puis clôturez-la pour figer les totaux.' }}</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-calendar-plus" size="large" @click="openCreate">Nouvelle période</v-btn></template>
    </PageHeader>
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />
    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        <div>
          <h2 class="text-lg font-bold text-[#252830]">Périodes de validation</h2>
          <p class="mt-1 text-xs text-[#747985]">Ouverte, puis en validation une fois la dernière journée écoulée, puis clôturée (définitif).</p>
        </div>
        <v-spacer />
        <v-select v-model="state" :items="periodStateOptions" placeholder="Tous les états" density="compact" hide-details clearable class="lg:max-w-[240px]" />
      </div>
      <v-divider />
      <PeriodTable v-if="filtered.length" :periods="filtered" :team-name="teamName" @view="view" />
      <AppEmptyState v-else-if="!isLoading" icon="mdi-calendar-blank-outline" title="Aucune période" :description="readonly ? 'Créez une période pour encadrer la validation des pointages de vos équipes.' : 'Créez une période pour valider puis clôturer les pointages de l’entreprise.'">
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-calendar-plus" @click="openCreate">Nouvelle période</v-btn>
      </AppEmptyState>
    </v-card>
    <PeriodCreateDialog v-model="createOpen" v-model:team-ids="createTeamIds" :teams="creatableTeams" :loading="isSaving" :error-message="createError" @submit="create" />
  </div>
</template>
