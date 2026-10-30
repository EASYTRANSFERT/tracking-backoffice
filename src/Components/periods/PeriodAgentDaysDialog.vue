<script setup lang="ts">
import { ref, watch } from 'vue'

import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import { usePeriodBilanStore } from '@/stores/period-bilan.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatMinutes } from '@/utils/duration'
import { formatPeriodDay } from '@/utils/period-format'
import type { PeriodDailyTotals } from '@/types/period'

const props = defineProps<{ periodId: string; agent: { userId: string; name: string } | null }>()
const emit = defineEmits<{ close: [] }>()

const store = usePeriodBilanStore()
const days = ref<PeriodDailyTotals[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
// Pagination par curseur : on garde les curseurs des pages déjà vues pour revenir en arrière.
const cursors = ref<(string | undefined)[]>([undefined])
const page = ref(1)
const nextCursor = ref<string | null>(null)

async function loadPage(index: number) {
  if (!props.agent) return
  isLoading.value = true
  error.value = null
  try {
    const result = await store.loadDaily(props.periodId, props.agent.userId, cursors.value[index])
    days.value = result.items
    nextCursor.value = result.nextCursor ?? null
    page.value = index + 1
  } catch (cause) {
    error.value = getApiErrorMessage(cause, 'Impossible de charger le détail par jour.')
  } finally {
    isLoading.value = false
  }
}

function next() {
  if (!nextCursor.value) return
  cursors.value = [...cursors.value.slice(0, page.value), nextCursor.value]
  void loadPage(page.value)
}

watch(() => props.agent?.userId, (userId) => {
  days.value = []
  cursors.value = [undefined]
  if (userId) void loadPage(0)
})
</script>

<template>
  <v-dialog :model-value="Boolean(agent)" max-width="720" scrollable @update:model-value="emit('close')">
    <v-card v-if="agent">
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <div class="min-w-0"><h2 class="text-base font-bold text-[#D80F16]">Détail par jour</h2><p class="mt-1 truncate text-xs font-normal text-[#747985]">{{ agent.name }}</p></div>
        <v-btn icon="mdi-close" variant="text" class="ml-auto shrink-0" aria-label="Fermer" @click="emit('close')" />
      </v-card-title>
      <v-divider />
      <v-progress-linear v-if="isLoading" indeterminate color="primary" height="2" />
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4" :text="error" />
      <v-table v-if="days.length" density="comfortable">
        <thead><tr><th>Jour</th><th>Sessions</th><th>Heures</th><th>Retard</th><th>Absences</th></tr></thead>
        <tbody>
          <tr v-for="day in days" :key="day.day">
            <td>{{ formatPeriodDay(day.day) }}</td><td>{{ day.sessionsCount }}</td><td>{{ formatMinutes(day.workedMinutes) }}</td><td>{{ formatMinutes(day.lateMinutes) }}</td><td>{{ day.absencesCount }}</td>
          </tr>
        </tbody>
      </v-table>
      <p v-else-if="!isLoading && !error" class="px-6 py-8 text-center text-sm text-[#747985]">Aucun jour sur cette période.</p>
      <AppTableFooter mode="cursor" label="jours" :page="page" :page-count="page" :start="1" :end="days.length" :has-previous="page > 1" :has-next="Boolean(nextCursor)" @previous="loadPage(page - 2)" @next="next" />
    </v-card>
  </v-dialog>
</template>
