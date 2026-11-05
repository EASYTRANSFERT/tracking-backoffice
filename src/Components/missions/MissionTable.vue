<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { computed, ref, watch } from 'vue'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import { usePagination } from '@/composables/usePagination'
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
const filtered = computed(() => {
  return [...props.missions].filter((mission) => {
    const startDate = mission.startAt?.slice(0, 10) ?? ''
    return matchesSearch(search.value, mission.code, mission.title)
      && (status.value === 'all' || mission.status === status.value)
      && (!dateFrom.value || Boolean(startDate && startDate >= dateFrom.value))
      && (!dateTo.value || Boolean(startDate && startDate <= dateTo.value))
  }).sort((a, b) => (b.startAt ?? b.createdAt ?? '').localeCompare(a.startAt ?? a.createdAt ?? ''))
})
const { page, pageCount, start, end, displayed } = usePagination(filtered, () => props.pageSize)
watch([search, status, dateFrom, dateTo], () => { page.value = 1 })
const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 2xl:flex-row 2xl:items-start">
      <div>
        <div class="flex items-center gap-3"><h2 class="text-lg font-bold text-[#252830]">{{ title }}</h2><v-chip color="primary" variant="tonal">{{ filtered.length }}</v-chip></div>
        <p class="mt-1 text-xs text-[#747985]">{{ description }}</p>
      </div>
      <v-spacer />
      <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-[760px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher" density="compact" hide-details clearable />
        <v-select v-model="status" :items="[{title:'Tous les statuts',value:'all'},{title:'Planifiées',value:'scheduled'},{title:'En cours',value:'ongoing'},{title:'Terminées',value:'completed'}]" density="compact" hide-details />
        <v-text-field v-model="dateFrom" type="date" label="Du" density="compact" hide-details />
        <v-text-field v-model="dateTo" type="date" label="Au" density="compact" hide-details />
      </div>
    </div>
    <v-divider />
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <div v-if="displayed.length" class="overflow-x-auto">
      <v-table hover class="min-w-[940px]">
        <thead><tr><th>Code</th><th>Mission</th><th>Début prévu</th><th>Fin prévue</th><th>Statut</th><th v-if="showActions" class="w-16"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="mission in displayed" :key="mission.id" :class="rowClickable ? 'cursor-pointer' : ''" @click="rowClickable && emit('view', mission)">
            <td class="text-sm font-medium text-[#535865]">{{ mission.code }}</td>
            <td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-clipboard-text-clock-outline" color="primary" /></v-avatar><div><p class="font-semibold text-[#292d38]">{{ mission.title }}</p><p class="line-clamp-1 max-w-[320px] text-xs text-[#848484]">{{ mission.notes || 'Aucune description' }}</p></div></div></td>
            <td class="whitespace-nowrap text-sm text-[#535865]">{{ formatDate(mission.startAt) }}</td>
            <td class="whitespace-nowrap text-sm text-[#535865]">{{ formatDate(mission.endAt) }}</td>
            <td><AppStatusChip :status="mission.status" /></td>
            <td v-if="showActions" @click.stop><v-menu location="bottom end"><template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template><v-list density="compact"><v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', mission)" /><v-list-item v-if="mission.status === 'scheduled'" prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', mission)" /><v-divider /><v-list-item v-if="mission.status === 'scheduled'" prepend-icon="mdi-play-circle-outline" title="Ouvrir la mission" @click="emit('open', mission)" /><v-list-item v-if="mission.status === 'ongoing'" prepend-icon="mdi-check-circle-outline" title="Clôturer la mission" @click="emit('close', mission)" /></v-list></v-menu></td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else-if="!loading" icon="mdi-clipboard-search-outline" title="Aucune mission trouvée" description="Créez une mission ou modifiez vos filtres." />
    <AppTableFooter v-if="filtered.length" v-model:page="page" :page-count="pageCount" :start="start + 1" :end="end" :total="filtered.length" label="missions" />
  </v-card>
</template>
