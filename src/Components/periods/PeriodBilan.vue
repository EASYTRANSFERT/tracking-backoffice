<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppErrorState from '@/Components/common/AppErrorState.vue'
import PeriodAgentDaysDialog from '@/Components/periods/PeriodAgentDaysDialog.vue'
import { usePeriodBilanStore } from '@/stores/period-bilan.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatMinutes } from '@/utils/duration'
import { reportErrorMessage } from '@/utils/period-report'
import { fullName } from '@/utils/people'
import type { PeriodReportFormat } from '@/types/period'

const props = defineProps<{ periodId: string }>()
const emit = defineEmits<{ 'show-sessions': [] }>()

const store = usePeriodBilanStore()
const feedback = useUiFeedbackStore()
const { totals, isLoading, downloading } = storeToRefs(store)
const loadError = ref<string | null>(null)
const selectedAgent = ref<{ userId: string; name: string } | null>(null)

const header = computed(() => totals.value?.period)
const waiting = computed(() => (header.value?.pending ?? 0) + (header.value?.open ?? 0))

async function load() {
  loadError.value = null
  try { await store.loadTotals(props.periodId) }
  catch (error) { loadError.value = getApiErrorMessage(error, 'Impossible de charger le bilan.') }
}
watch(() => props.periodId, load, { immediate: true })

async function download(format: PeriodReportFormat) {
  if (!header.value?.final) {
    const confirmed = await feedback.askConfirmation({ title: 'Totaux provisoires', message: 'Ces totaux sont provisoires, télécharger quand même ?', confirmText: 'Télécharger' })
    if (!confirmed) return
  }
  try { await store.downloadReport(props.periodId, format) }
  catch (error) { feedback.error(reportErrorMessage(error)) }
}
</script>

<template>
  <div class="space-y-6">
    <AppErrorState v-if="loadError" title="Bilan indisponible" :description="loadError" />
    <v-progress-linear v-else-if="isLoading || !totals || !header" indeterminate color="primary" />

    <template v-else>
      <div class="space-y-3">
        <v-alert v-if="header.final" type="success" variant="tonal" density="compact" title="Totaux définitifs" />
        <v-alert v-else type="warning" variant="tonal" density="compact" title="Totaux provisoire" text="Cette période n'est pas encore terminée" />
        <v-alert v-if="waiting > 0" type="info" variant="tonal" density="compact">
          {{ waiting }} session{{ waiting > 1 ? 's' : '' }} en attente ou ouverte{{ waiting > 1 ? 's' : '' }}, hors totaux.
          <a href="#" class="ml-1 font-semibold underline" @click.prevent="emit('show-sessions')">Voir ces sessions</a>
        </v-alert>
        <v-alert v-if="header.forced" type="error" variant="tonal" density="compact" :text="`Clôture forcée — ${header.unvalidatedCount} session${header.unvalidatedCount > 1 ? 's' : ''} hors totaux.`" />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <v-btn variant="outlined" color="#535865" class="border-[#d9dce2]" :loading="downloading === 'xlsx'" :disabled="Boolean(downloading)" @click="download('xlsx')"><template #prepend><v-icon icon="mdi-file-excel-outline" color="#1E7D4F" /></template><span class="text-[#1E7D4F]">Télécharger Excel</span></v-btn>
        <v-btn variant="outlined" color="#535865" class="border-[#d9dce2]" :loading="downloading === 'pdf'" :disabled="Boolean(downloading)" @click="download('pdf')"><template #prepend><v-icon icon="mdi-file-pdf-box" color="#D80F16" /></template><span class="text-[#D80F16]">Télécharger PDF</span></v-btn>
      </div>

      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-group-outline" color="primary" /></v-avatar><h2 class="text-base font-bold">Agents</h2></v-card-title>
        <v-divider />
        <div class="overflow-x-auto">
          <v-table hover class="min-w-[720px]">
            <thead><tr><th>Matricule</th><th>Nom</th><th>Jours travaillés</th><th>Sessions</th><th>Heures</th><th>Retard</th><th>Absences</th></tr></thead>
            <tbody>
              <tr v-for="agent in totals.agents" :key="agent.userId" class="cursor-pointer" @click="selectedAgent = { userId: agent.userId, name: fullName(agent) }">
                <td class="font-mono text-sm">{{ agent.matricule || '—' }}</td><td class="font-semibold">{{ fullName(agent) }}</td><td>{{ agent.daysWorked }}</td><td>{{ agent.sessionsCount }}</td><td>{{ formatMinutes(agent.workedMinutes) }}</td><td>{{ formatMinutes(agent.lateMinutes) }}</td><td>{{ agent.absencesCount }}</td>
              </tr>
              <tr v-if="!totals.agents.length"><td colspan="7" class="py-6 text-center text-sm text-[#747985]">Aucun agent sur cette période.</td></tr>
            </tbody>
            <tfoot>
              <tr class="bg-[#FDE9EA] font-bold text-[#D80F16]">
                <td /><td>Équipe ({{ totals.team.agents }} agent{{ totals.team.agents > 1 ? 's' : '' }})</td><td>{{ totals.team.daysWorked }}</td><td>{{ totals.team.sessionsCount }}</td><td>{{ formatMinutes(totals.team.workedMinutes) }}</td><td>{{ formatMinutes(totals.team.lateMinutes) }}</td><td>{{ totals.team.absencesCount }}</td>
              </tr>
            </tfoot>
          </v-table>
        </div>
        <p class="px-6 py-3 text-xs text-[#747985]">Cliquez sur un agent pour voir son détail jour par jour.</p>
      </v-card>

      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-radius-outline" color="primary" /></v-avatar><h2 class="text-base font-bold">Par site</h2></v-card-title>
        <v-divider />
        <div class="overflow-x-auto">
          <v-table class="min-w-[620px]">
            <thead><tr><th>Site</th><th>Agents</th><th>Sessions</th><th>Heures</th><th>Retard</th><th>Absences</th></tr></thead>
            <tbody>
              <tr v-for="site in totals.sites" :key="site.siteId">
                <td class="font-semibold">{{ site.siteName }}</td><td>{{ site.agents }}</td><td>{{ site.sessionsCount }}</td><td>{{ formatMinutes(site.workedMinutes) }}</td><td>{{ formatMinutes(site.lateMinutes) }}</td><td>{{ site.absencesCount }}</td>
              </tr>
              <tr v-if="!totals.sites.length"><td colspan="6" class="py-6 text-center text-sm text-[#747985]">Aucun site.</td></tr>
            </tbody>
          </v-table>
        </div>
      </v-card>
    </template>

    <PeriodAgentDaysDialog :period-id="periodId" :agent="selectedAgent" @close="selectedAgent = null" />
  </div>
</template>
