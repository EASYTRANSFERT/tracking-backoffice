<script setup lang="ts">
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import { formatDateTime } from '@/Components/attendance/attendance-labels'
import PeriodStateChip from '@/Components/periods/PeriodStateChip.vue'
import { formatPeriodRange } from '@/utils/period-format'
import type { PeriodResponse } from '@/types/period'

defineProps<{ periods: PeriodResponse[]; teamName: (teamId?: string) => string; resetOn?: unknown[] }>()
const emit = defineEmits<{ view: [period: PeriodResponse] }>()

const columns: AppDataTableColumn[] = [
  { key: 'range', title: 'Période' },
  { key: 'state', title: 'État' },
  { key: 'team', title: 'Équipe', cellClass: 'text-sm font-medium text-[#292d38]' },
  { key: 'closedAt', title: 'Clôturée le', cellClass: 'text-sm text-[#535865]' },
  { key: 'open', title: 'Ouvrir', class: 'w-12', srOnly: true },
]
</script>

<template>
  <AppDataTable bare clickable :items="periods" :columns="columns" label="périodes" :reset-on="resetOn" table-class="min-w-[760px]" @click:row="emit('view', $event)">
    <template #cell-range="{ item: period }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-calendar-range" color="primary" /></v-avatar>
        <p class="font-semibold text-[#292d38]">{{ formatPeriodRange(period) }}</p>
      </div>
    </template>
    <template #cell-state="{ item: period }"><PeriodStateChip :state="period.state" /></template>
    <template #cell-team="{ item: period }">{{ teamName(period.teamId) }}</template>
    <template #cell-closedAt="{ item: period }">{{ period.closedAt ? formatDateTime(period.closedAt) : '—' }}</template>
    <template #cell-open><v-icon icon="mdi-chevron-right" color="secondary" /></template>
  </AppDataTable>
</template>
