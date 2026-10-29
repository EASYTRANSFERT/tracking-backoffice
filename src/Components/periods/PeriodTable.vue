<script setup lang="ts">
import { formatDateTime } from '@/Components/attendance/attendance-labels'
import PeriodStateChip from '@/Components/periods/PeriodStateChip.vue'
import { formatPeriodRange } from '@/utils/period-format'
import type { PeriodResponse } from '@/types/period'

defineProps<{ periods: PeriodResponse[] }>()
const emit = defineEmits<{ view: [period: PeriodResponse] }>()

/** Ce qui mérite d'être vu d'un coup d'œil dans la liste, sans ouvrir la période. */
function remark(period: PeriodResponse) {
  if (period.forced) return `Clôture forcée · ${period.unvalidatedCount ?? 0} session${(period.unvalidatedCount ?? 0) > 1 ? 's' : ''} hors totaux`
  if (period.state === 'IN_VALIDATION' && period.lastClosureFailure) return `Dernière clôture refusée · ${period.lastClosureFailure.pending + period.lastClosureFailure.open} session(s) à traiter`
  if (period.state === 'OPEN' && period.reopenedAt) return 'Rouverte pour correction'
  return '—'
}
</script>

<template>
  <div class="overflow-x-auto">
    <v-table hover class="min-w-[760px]">
      <thead>
        <tr><th>Période</th><th>État</th><th>Remarque</th><th>Clôturée le</th><th class="w-12"><span class="sr-only">Ouvrir</span></th></tr>
      </thead>
      <tbody>
        <tr v-for="period in periods" :key="period.id" class="cursor-pointer" @click="emit('view', period)">
          <td>
            <div class="flex min-h-16 items-center gap-3">
              <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-calendar-range" color="primary" /></v-avatar>
              <p class="font-semibold text-[#292d38]">{{ formatPeriodRange(period) }}</p>
            </div>
          </td>
          <td><PeriodStateChip :state="period.state" /></td>
          <td class="text-sm text-[#535865]">{{ remark(period) }}</td>
          <td class="text-sm text-[#535865]">{{ period.closedAt ? formatDateTime(period.closedAt) : '—' }}</td>
          <td><v-icon icon="mdi-chevron-right" color="secondary" /></td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
