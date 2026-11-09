<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { computed, ref } from 'vue'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import type { Mission, MissionStatus } from '@/types/administrator'

const props = withDefaults(defineProps<{
  missions: Mission[]
  loading?: boolean
  pageSize?: number
  title?: string
  description?: string
  showActions?: boolean
  rowClickable?: boolean
}>(), {
  loading: false,
  pageSize: 6,
  title: 'Planification des missions',
  description: 'Suivez la planification et l’exécution des missions.',
  showActions: true,
  rowClickable: true,
})
const emit = defineEmits<{
  view: [mission: Mission]
  edit: [mission: Mission]
  open: [mission: Mission]
  close: [mission: Mission]
}>()

const search = ref('')
const status = ref<MissionStatus | 'all'>('all')
const dateFrom = ref('')
const dateTo = ref('')
const statusItems = [{ title: 'Tous les statuts', value: 'all' }, { title: 'Planifiées', value: 'scheduled' }, { title: 'En cours', value: 'ongoing' }, { title: 'Terminées', value: 'completed' }]
const filtered = computed(() => {
  return [...props.missions].filter((mission) => {
    const startDate = mission.startAt?.slice(0, 10) ?? ''
    return matchesSearch(search.value, mission.code, mission.title)
      && (status.value === 'all' || mission.status === status.value)
      && (!dateFrom.value || Boolean(startDate && startDate >= dateFrom.value))
      && (!dateTo.value || Boolean(startDate && startDate <= dateTo.value))
  }).sort((a, b) => (b.startAt ?? b.createdAt ?? '').localeCompare(a.startAt ?? a.createdAt ?? ''))
})
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'

const date = 'whitespace-nowrap text-sm text-[#535865]'
const columns = computed<AppDataTableColumn[]>(() => [
  { key: 'code', title: 'Code', cellClass: 'text-sm font-medium text-[#535865]' },
  { key: 'mission', title: 'Mission' },
  { key: 'startAt', title: 'Début prévu', cellClass: date },
  { key: 'endAt', title: 'Fin prévue', cellClass: date },
  { key: 'status', title: 'Statut' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true, show: props.showActions },
])
</script>

<template>
  <AppDataTable
    :items="filtered"
    :columns="columns"
    :page-size="pageSize"
    :reset-on="[search, status, dateFrom, dateTo]"
    :title="title"
    :subtitle="description"
    :loading="loading"
    :clickable="rowClickable"
    label="missions"
    header-class="2xl:flex-row 2xl:items-start"
    table-class="min-w-[940px]"
    empty-icon="mdi-clipboard-search-outline"
    empty-title="Aucune mission trouvée"
    empty-description="Créez une mission ou modifiez vos filtres."
    @click:row="emit('view', $event)"
  >
    <template #title-extra="{ count }"><v-chip color="primary" variant="tonal">{{ count }}</v-chip></template>
    <template #filters>
      <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-[760px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher" density="compact" hide-details clearable />
        <v-select v-model="status" :items="statusItems" density="compact" hide-details />
        <v-text-field v-model="dateFrom" type="date" label="Du" density="compact" hide-details />
        <v-text-field v-model="dateTo" type="date" label="Au" density="compact" hide-details />
      </div>
    </template>
    <template #cell-mission="{ item: mission }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-clipboard-text-clock-outline" color="primary" /></v-avatar>
        <div>
          <p class="font-semibold text-[#292d38]">{{ mission.title }}</p>
          <p class="line-clamp-1 max-w-[320px] text-xs text-[#848484]">{{ mission.notes || 'Aucune description' }}</p>
        </div>
      </div>
    </template>
    <template #cell-startAt="{ item: mission }">{{ formatDate(mission.startAt) }}</template>
    <template #cell-endAt="{ item: mission }">{{ formatDate(mission.endAt) }}</template>
    <template #cell-status="{ item: mission }"><AppStatusChip :status="mission.status" /></template>
    <template #cell-actions="{ item: mission }">
      <div @click.stop>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', mission)" />
            <v-list-item v-if="mission.status === 'scheduled'" prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', mission)" />
            <v-divider />
            <v-list-item v-if="mission.status === 'scheduled'" prepend-icon="mdi-play-circle-outline" title="Ouvrir la mission" @click="emit('open', mission)" />
            <v-list-item v-if="mission.status === 'ongoing'" prepend-icon="mdi-check-circle-outline" title="Clôturer la mission" @click="emit('close', mission)" />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
