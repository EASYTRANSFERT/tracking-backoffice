<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppDialogClose from '@/Components/common/AppDialogClose.vue'
import PeriodStateChip from '@/Components/periods/PeriodStateChip.vue'
import { usePeriodAccess } from '@/composables/usePeriodAccess'
import { useMissionOverviewStore } from '@/stores/mission-overview.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatMinutes } from '@/utils/duration'
import { formatPeriodRange } from '@/utils/period-format'

const props = defineProps<{ modelValue: boolean; missionId: string; missionTitle?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const DAY_MS = 86_400_000
const DEFAULT_WINDOW_DAYS = 90
const MAX_WINDOW_DAYS = 366

const store = useMissionOverviewStore()
const { overview, isLoading } = storeToRefs(store)
const { detailsRoute } = usePeriodAccess()

const dayKey = (date: Date) => date.toISOString().slice(0, 10)
const defaultTo = () => dayKey(new Date())
const defaultFrom = () => dayKey(new Date(Date.now() - DEFAULT_WINDOW_DAYS * DAY_MS))
const from = ref(defaultFrom())
const to = ref(defaultTo())
const error = ref<string | null>(null)

const windowError = computed(() => {
  if (!from.value || !to.value) return 'Choisissez les deux dates.'
  if (to.value < from.value) return 'La fin ne peut pas précéder le début.'
  if ((Date.parse(to.value) - Date.parse(from.value)) / DAY_MS > MAX_WINDOW_DAYS) return 'La fenêtre ne peut pas dépasser un an.'
  return null
})

async function load() {
  if (windowError.value) return
  error.value = null
  try { await store.load(props.missionId, { from: from.value, to: to.value }) }
  catch (cause) { error.value = getApiErrorMessage(cause, 'Impossible de charger la vue d’ensemble.') }
}

function resetWindow() { from.value = defaultFrom(); to.value = defaultTo(); void load() }

watch(() => props.modelValue, (open) => { if (open) resetWindow() })

const siteName = (siteId: string) =>
  overview.value?.sites.find((site) => site.siteId === siteId)?.name ?? 'Site'
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="1100" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="px-6 py-5 pr-16">
        <div><h2 class="text-base font-bold">Vue d’ensemble</h2><p v-if="missionTitle" class="mt-1 text-xs font-normal text-[#747985]">{{ missionTitle }}</p></div>
        <AppDialogClose @close="emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />
      <v-card-text class="space-y-6 px-6 py-6">
        <div class="flex flex-wrap items-start gap-3">
          <v-text-field v-model="from" type="date" label="Du" density="compact" hide-details class="max-w-[190px]" />
          <v-text-field v-model="to" type="date" label="Au" density="compact" hide-details class="max-w-[190px]" />
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" :disabled="Boolean(windowError)" :loading="isLoading" @click="load">Afficher</v-btn>
          <v-btn variant="text" color="primary" @click="resetWindow">90 derniers jours</v-btn>
        </div>
        <p v-if="windowError" class="text-sm text-[#B00C12]">{{ windowError }}</p>
        <p class="text-xs text-[#747985]">Fenêtre de 90 jours par défaut, un an au maximum.</p>

        <v-progress-linear v-if="isLoading" indeterminate color="primary" />
        <v-alert v-if="error" type="error" variant="tonal" :text="error" />

        <template v-if="overview">
          <section>
            <h3 class="mb-3 flex items-center gap-2 text-sm font-bold text-[#292d38]"><v-icon icon="mdi-map-marker-radius-outline" color="primary" size="20" />Aujourd’hui</h3>
            <div v-if="overview.sites.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <v-card v-for="site in overview.sites" :key="site.siteId" elevation="0" class="border border-[#eceef2]">
                <v-card-text class="space-y-3">
                  <div><p class="font-semibold text-[#292d38]">{{ site.name }}</p><p v-if="site.teamId" class="text-xs text-[#747985]">{{ site.teamName }}</p><p v-else class="text-xs text-[#B00C12]">Aucune équipe affectée</p></div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div><p class="text-xs text-[#848484]">Sessions</p><p class="text-lg font-bold tabular-nums">{{ site.todaySessions }}</p></div>
                    <div><p class="text-xs text-[#848484]">Présents en ce moment</p><p class="text-lg font-bold tabular-nums">{{ site.todayOpen }}</p></div>
                    <div><p class="text-xs text-[#848484]">À valider</p><p class="text-lg font-bold tabular-nums" :class="site.todayPendingValidation ? 'text-[#D80F16]' : ''">{{ site.todayPendingValidation }}</p></div>
                    <div><p class="text-xs text-[#848484]">Absences</p><p class="text-lg font-bold tabular-nums">{{ site.todayAbsences }}</p></div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
            <p v-else class="text-sm text-[#747985]">Aucun site dans cette mission.</p>
          </section>

          <section>
            <h3 class="mb-3 flex items-center gap-2 text-sm font-bold text-[#292d38]"><v-icon icon="mdi-account-group-outline" color="primary" size="20" />Équipes</h3>
            <p v-if="!overview.teams.length" class="text-sm text-[#747985]">Aucune équipe n’intervient sur cette mission.</p>
            <v-card v-for="team in overview.teams" :key="team.teamId" elevation="0" class="mb-4 border border-[#eceef2]">
              <v-card-title class="px-5 py-4 text-base font-bold text-[#D80F16]">{{ team.teamName }}</v-card-title>
              <v-divider />
              <v-card-text class="space-y-4">
                <p v-if="!team.periods.length" class="text-sm text-[#747985]">Aucune période sur cette fenêtre.</p>
                <div v-for="period in team.periods" :key="period.periodId" class="rounded-lg border border-[#eceef2] p-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold">{{ formatPeriodRange(period) }}</span>
                    <PeriodStateChip :state="period.state" />
                    <v-chip size="small" variant="tonal" :color="period.final ? 'success' : 'warning'">{{ period.final ? 'Définitif' : 'Provisoire' }}</v-chip>
                    <v-spacer />
                    <v-btn size="small" variant="text" append-icon="mdi-arrow-right" :to="{ name: detailsRoute, params: { periodId: period.periodId }, query: { tab: 'bilan' } }">Voir le bilan</v-btn>
                  </div>
                  <div class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><p class="text-xs text-[#848484]">Sessions</p><p class="font-bold tabular-nums">{{ period.totals.sessionsCount }}</p></div>
                    <div><p class="text-xs text-[#848484]">Heures</p><p class="font-bold tabular-nums">{{ formatMinutes(period.totals.workedMinutes) }}</p></div>
                    <div><p class="text-xs text-[#848484]">Retard</p><p class="font-bold tabular-nums">{{ formatMinutes(period.totals.lateMinutes) }}</p></div>
                    <div><p class="text-xs text-[#848484]">Absences</p><p class="font-bold tabular-nums">{{ period.totals.absencesCount }}</p></div>
                  </div>
                  <p class="mt-2 text-xs text-[#747985]">Total de l’équipe entière, sites d’autres missions compris.</p>
                  <p v-if="period.pending || period.open" class="mt-1 text-xs text-[#B26A00]">{{ period.pending }} en attente, {{ period.open }} ouverte(s) : hors totaux.</p>
                  <v-table v-if="period.bySite.length" density="compact" class="mt-3 border border-[#eceef2]">
                    <thead><tr><th>Site de la mission</th><th>Agents</th><th>Sessions</th><th>Heures</th><th>Retard</th><th>Absences</th></tr></thead>
                    <tbody>
                      <tr v-for="row in period.bySite" :key="row.siteId">
                        <td>{{ siteName(row.siteId) }}</td><td>{{ row.agents }}</td><td>{{ row.sessionsCount }}</td><td>{{ formatMinutes(row.workedMinutes) }}</td><td>{{ formatMinutes(row.lateMinutes) }}</td><td>{{ row.absencesCount }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card-text>
            </v-card>
          </section>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
