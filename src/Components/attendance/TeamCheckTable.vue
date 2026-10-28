<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import { checkResultConfig, formatDateTime } from '@/Components/attendance/attendance-labels'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { ApiCheckResult } from '@/types/check'
import type { Site } from '@/types/administrator'

/** Contrôles de présence des équipes travaillant sur les sites d'une mission, et leurs réponses. */
const props = defineProps<{ sites: Site[] }>()

const store = useAttendanceStore()
const feedback = useUiFeedbackStore()
const result = ref<ApiCheckResult | 'all'>('all')
const page = ref(1)
const pageSize = 8

const teamIds = computed(() => [...new Set(props.sites.map((site) => site.teamId).filter((id): id is string => Boolean(id)))])
// L'API ne renvoie que l'équipe : on la présente par le site où elle travaille.
const siteName = (teamId?: string) => props.sites.filter((site) => site.teamId === teamId).map((site) => site.name).join(', ') || 'Équipe'

const filtered = computed(() => store.checks.filter((check) => result.value === 'all' || check.result === result.value))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const start = computed(() => (page.value - 1) * pageSize)
const displayed = computed(() => filtered.value.slice(start.value, start.value + pageSize))
const resultItems = [{ title: 'Tous les résultats', value: 'all' }, ...Object.entries(checkResultConfig).map(([value, config]) => ({ title: config.label, value }))]

watch(result, () => { page.value = 1 })
watch(teamIds, async (ids) => {
  page.value = 1
  if (!ids.length) return
  try { await store.loadTeamChecks(ids) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les contrôles.')) }
}, { immediate: true })
</script>

<template>
  <v-card>
    <div class="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-check-outline" color="primary" /></v-avatar>
        <div><h2 class="text-base font-bold">Contrôles de présence</h2><p class="mt-1 text-xs text-[#747985]">Réponses du chef d’équipe pour chaque agent contrôlé.</p></div>
      </div>
      <v-select v-model="result" :items="resultItems" density="compact" hide-details class="sm:max-w-[240px]" />
    </div>
    <v-divider />
    <v-progress-linear v-if="store.isChecksLoading" indeterminate color="primary" />

    <div v-if="filtered.length" class="overflow-x-auto">
      <v-table class="min-w-[760px]">
        <thead><tr><th>Agent</th><th>Site</th><th>Lancé le</th><th>Échéance</th><th>Résultat</th><th>Réponse</th></tr></thead>
        <tbody>
          <tr v-for="check in displayed" :key="check.id">
            <td class="font-semibold text-[#292d38]">{{ store.agentName(check.userId) }}</td>
            <td class="text-sm text-[#535865]">{{ siteName(check.teamId) }}</td>
            <td class="whitespace-nowrap text-sm text-[#535865]">{{ formatDateTime(check.dueAt) }}</td>
            <td class="whitespace-nowrap text-sm text-[#535865]">{{ formatDateTime(check.deadlineAt) }}</td>
            <td><v-chip size="small" variant="tonal" :color="checkResultConfig[check.result].color" :prepend-icon="checkResultConfig[check.result].icon">{{ checkResultConfig[check.result].label }}</v-chip></td>
            <td class="whitespace-nowrap text-sm text-[#535865]">
              <template v-if="check.answeredAt">{{ formatDateTime(check.answeredAt) }}<span v-if="check.remote" class="block text-xs text-[#848484]">À distance</span></template>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else-if="!store.isChecksLoading" icon="mdi-account-check-outline" title="Aucun contrôle" description="Lancez un contrôle depuis une équipe pendant que la mission est en cours." />
    <AppTableFooter v-if="filtered.length" :page="page" :page-count="pageCount" :start="start + 1" :end="Math.min(start + pageSize, filtered.length)" :total="filtered.length" label="contrôles" @update:page="page = $event" />
  </v-card>
</template>
