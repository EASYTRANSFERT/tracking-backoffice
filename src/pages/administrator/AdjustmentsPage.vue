<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import AdjustmentForm from '@/Components/adjustments/AdjustmentForm.vue'
import AdjustmentTimeline from '@/Components/adjustments/AdjustmentTimeline.vue'
import SessionFinder from '@/Components/adjustments/SessionFinder.vue'
import { flagLabels, formatDateTime, formatMinutes, statusLabels, validationConfig } from '@/Components/attendance/attendance-labels'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import PeriodStateChip from '@/Components/periods/PeriodStateChip.vue'
import { useAdjustmentAccess } from '@/composables/useAdjustmentAccess'
import { useUserDisplay } from '@/composables/useUserDisplay'
import { useAdjustmentStore } from '@/stores/adjustment.store'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { adjustmentErrorMessage } from '@/utils/adjustment-format'
import { getApiErrorMessage } from '@/utils/api-error'
import { isTeamMember } from '@/utils/people'
import { formatPeriodRange } from '@/utils/period-format'
import type { CreateAdjustmentRequest } from '@/types/adjustment'
import type { EnterpriseUser } from '@/types/administrator'
import type { SessionListQuery, WorkSessionResponse } from '@/types/attendance'

const route = useRoute()
const store = useAdjustmentStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { results, nextCursor, isSearching, selected, selectedPeriod, history, isHistoryLoading, isSaving } = storeToRefs(store)
const { users, sites } = storeToRefs(administratorStore)

// Le superviseur ne voit que son périmètre : les sites de ses missions et les membres des équipes qui y travaillent.
const { isSupervisor } = useAdjustmentAccess()
const supervisorStore = useSupervisorStore()
const scopeAgents = ref<EnterpriseUser[]>([])
const agents = computed(() => isSupervisor.value ? scopeAgents.value : users.value.filter(isTeamMember))
const finderSites = computed(() => isSupervisor.value ? supervisorStore.sites : sites.value)
const agentName = (id?: string) => store.personName(id, 'Agent')
const { userName } = useUserDisplay()
// L'auteur d'une régularisation n'est pas forcément un agent : on affiche son vrai rôle, ou rien de supposé.
const authorName = (id?: string) => userName(id, true)
const siteName = (id?: string) => (id ? finderSites.value.find((site) => site.id === id)?.name : undefined) ?? '—'
const formError = ref<string | null>(null)
// Une période en clôture ou clôturée refuse toute régularisation : on ne propose alors pas le formulaire.
const locked = computed(() => store.isLocked())

onMounted(async () => {
  if (isSupervisor.value) loadSupervisorScope()
  else {
    administratorStore.loadDirectory().catch(() => undefined)
    administratorStore.loadSites().catch(() => undefined)
  }
  const sessionId = route.query.sessionId
  if (typeof sessionId === 'string' && sessionId) {
    try { await store.selectById(sessionId) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger cette session.')) }
  }
  await search({})
})
onBeforeUnmount(() => store.reset())

async function loadSupervisorScope() {
  try {
    await supervisorStore.loadScope()
    const lists = await Promise.all([...supervisorStore.scopeTeamIds].map((teamId) => administratorStore.listTeamMembers(teamId)))
    scopeAgents.value = [...new Map(lists.flat().map((agent) => [agent.id, agent])).values()]
  } catch {
    // Le filtre par agent reste vide ; la recherche par site, date et statut fonctionne toujours.
  }
}

async function search(filters: SessionListQuery) {
  try { await store.search(filters) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sessions.')) }
}

async function loadMore() {
  try { await store.loadMore() } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger la suite des sessions.')) }
}

async function select(session: WorkSessionResponse) {
  formError.value = null
  try { await store.select(session) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger l’historique de cette session.')) }
}

async function submit(request: CreateAdjustmentRequest) {
  formError.value = null
  try {
    await store.regularize(request)
    feedback.success('Régularisation enregistrée.')
  } catch (error) {
    formError.value = adjustmentErrorMessage(error) ?? getApiErrorMessage(error, 'Impossible d’enregistrer la régularisation.')
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Régularisations</template>
      <template #description>Corrigez l’entrée, la sortie ou le retard d’une session, avec un motif, et consultez l’historique de ses corrections.</template>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <SessionFinder
        :agents="agents"
        :sites="finderSites"
        :sessions="results"
        :loading="isSearching"
        :has-next="Boolean(nextCursor)"
        :selected-id="selected?.id"
        :agent-name="agentName"
        :site-name="siteName"
        @search="search"
        @select="select"
        @load-more="loadMore"
      />

      <v-card v-if="!selected" variant="flat" color="transparent">
        <AppEmptyState icon="mdi-cursor-default-click-outline" title="Choisissez une session" description="Sélectionnez dans la liste la session à régulariser." />
      </v-card>

      <v-card v-else>
        <div class="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <h2 class="text-lg font-bold">{{ agentName(selected.userId) }}</h2>
            <p class="mt-1 text-sm text-medium-emphasis">{{ siteName(selected.siteId) }} · {{ selected.day ?? '—' }} · {{ statusLabels[selected.status] }}</p>
          </div>
          <v-chip :color="validationConfig[selected.validation].color" variant="tonal">{{ validationConfig[selected.validation].label }}</v-chip>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4 px-6 pb-5 sm:grid-cols-4">
          <div><p class="text-xs text-medium-emphasis">Entrée</p><p class="mt-1 font-medium">{{ formatDateTime(selected.inAt) }}</p></div>
          <div><p class="text-xs text-medium-emphasis">Sortie</p><p class="mt-1 font-medium">{{ formatDateTime(selected.outAt) }}</p></div>
          <div><p class="text-xs text-medium-emphasis">Durée travaillée</p><p class="mt-1 font-medium">{{ formatMinutes(selected.minutes) }}</p></div>
          <div><p class="text-xs text-medium-emphasis">Retard retenu</p><p class="mt-1 font-medium">{{ formatMinutes(selected.lateMin ?? 0) }}</p></div>
          <div v-if="selectedPeriod" class="col-span-2">
            <p class="text-xs text-medium-emphasis">Période</p>
            <p class="mt-1 flex flex-wrap items-center gap-2 font-medium">{{ formatPeriodRange(selectedPeriod) }}<PeriodStateChip :state="selectedPeriod.state" /></p>
          </div>
          <div v-if="selected.flags.length" class="col-span-2">
            <p class="text-xs text-medium-emphasis">Anomalies</p>
            <div class="mt-1 flex flex-wrap gap-2"><v-chip v-for="flag in selected.flags" :key="flag" color="warning" variant="tonal" size="small">{{ flagLabels[flag] }}</v-chip></div>
          </div>
        </div>

        <v-divider />
        <h3 class="px-6 pt-5 font-semibold">Nouvelle régularisation</h3>
        <v-card-text v-if="locked" class="px-6 py-4">
          <v-alert type="warning" variant="tonal" density="compact" text="La période de cette session est en clôture ou clôturée : elle ne peut plus être régularisée. L’historique reste consultable ci-dessous." />
        </v-card-text>
        <AdjustmentForm v-else :session="selected" :loading="isSaving" :error-message="formError" @submit="submit" />

        <v-divider />
        <h3 class="px-6 pt-5 font-semibold">Historique</h3>
        <v-progress-linear v-if="isHistoryLoading" indeterminate color="primary" height="2" class="mt-3" />
        <AdjustmentTimeline v-if="history.length" :adjustments="history" :author-name="authorName" />
        <p v-else-if="!isHistoryLoading" class="px-6 py-6 text-sm text-medium-emphasis">Cette session n’a jamais été régularisée.</p>
      </v-card>
    </div>
  </div>
</template>
