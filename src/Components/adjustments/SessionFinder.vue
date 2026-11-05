<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import { formatDateTime, statusLabels, validationConfig } from '@/Components/attendance/attendance-labels'
import { addDays, fromDayKey } from '@/Components/sites/site-schedule'
import { usePagination } from '@/composables/usePagination'
import { fullName } from '@/utils/people'
import type { EnterpriseUser, Site } from '@/types/administrator'
import type { ApiSessionStatus, ApiSessionValidation, SessionListQuery, WorkSessionResponse } from '@/types/attendance'

/** Recherche d'une session à régulariser : filtres de GET /sessions et liste paginée par curseur. */
const props = defineProps<{
  agents: EnterpriseUser[]
  sites: Site[]
  sessions: WorkSessionResponse[]
  loading?: boolean
  hasNext?: boolean
  selectedId?: string
  agentName: (id?: string) => string
  siteName: (id?: string) => string
}>()
const emit = defineEmits<{ search: [filters: SessionListQuery]; select: [session: WorkSessionResponse]; loadMore: [] }>()

const filters = reactive({
  userId: null as string | null,
  siteId: null as string | null,
  from: '',
  to: '',
  status: null as ApiSessionStatus | null,
  validation: null as ApiSessionValidation | null,
  flagged: false,
})

const statusOptions = Object.entries(statusLabels).map(([value, title]) => ({ value, title }))
const pagination = usePagination(toRef(props, 'sessions'), 5)
// Les sessions arrivent par lots de l'API : arrivé sur la dernière page chargée, on demande le lot suivant.
watch([pagination.page, pagination.pageCount], ([page, count]) => { if (page === count && props.hasNext && !props.loading) emit('loadMore') })

const validationOptions = Object.entries(validationConfig).map(([value, { label }]) => ({ value, title: label }))
const agentOptions = computed(() => props.agents.map((agent) => ({ value: agent.id, title: `${fullName(agent)} · ${agent.employeeNumber}` })))

// L'API borne l'entrée : `from` inclus, `to` exclu. Le champ « Au » est une journée incluse : on prend le lendemain.
const startOf = (day: string) => fromDayKey(day).toISOString()

function search() {
  pagination.page.value = 1
  emit('search', {
    userId: filters.userId || undefined,
    siteId: filters.siteId || undefined,
    status: filters.status || undefined,
    validation: filters.validation || undefined,
    from: filters.from ? startOf(filters.from) : undefined,
    to: filters.to ? startOf(addDays(filters.to, 1)) : undefined,
    flagged: filters.flagged || undefined,
  })
}

// Recherche à chaque changement de filtre : pas de bouton « Rechercher ».
watch(filters, search)

// Filtres secondaires repliés par défaut ; le badge compte ceux qui sont actifs.
const showFilters = ref(false)
const activeCount = computed(() => [filters.siteId, filters.from, filters.to, filters.status, filters.validation, filters.flagged].filter(Boolean).length)

function clearFilters() {
  Object.assign(filters, { siteId: null, from: '', to: '', status: null, validation: null, flagged: false })
}
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex items-center gap-2 px-4 py-4">
      <v-autocomplete v-model="filters.userId" :items="agentOptions" placeholder="Rechercher un agent" prepend-inner-icon="mdi-magnify" density="compact" clearable hide-details class="flex-1" no-data-text="Aucun agent ne correspond." />
      <v-badge :model-value="activeCount > 0" :content="activeCount" color="primary">
        <v-btn :icon="showFilters ? 'mdi-chevron-up' : 'mdi-tune-variant'" variant="text" :aria-label="showFilters ? 'Masquer les filtres' : 'Plus de filtres'" @click="showFilters = !showFilters" />
      </v-badge>
    </div>
    <v-expand-transition>
      <div v-show="showFilters" class="space-y-3 px-4 pb-4">
        <v-autocomplete v-model="filters.siteId" :items="sites" item-title="name" item-value="id" label="Site" density="compact" clearable hide-details no-data-text="Aucun site ne correspond." />
        <div class="grid grid-cols-2 gap-3">
          <v-text-field v-model="filters.from" type="date" label="Du" density="compact" hide-details />
          <v-text-field v-model="filters.to" type="date" label="Au" density="compact" hide-details />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <v-select v-model="filters.status" :items="statusOptions" label="Statut" density="compact" clearable hide-details />
          <v-select v-model="filters.validation" :items="validationOptions" label="Validation" density="compact" clearable hide-details />
        </div>
        <div class="flex items-center justify-between gap-2">
          <v-switch v-model="filters.flagged" color="primary" density="compact" hide-details label="Avec anomalie" />
          <v-btn v-if="activeCount" variant="text" size="small" @click="clearFilters">Effacer</v-btn>
        </div>
      </div>
    </v-expand-transition>
    <v-progress-linear :active="loading" indeterminate color="primary" height="2" />
    <v-divider />
    <v-list v-if="sessions.length" class="py-0" lines="two">
      <template v-for="(session, index) in pagination.displayed.value" :key="session.id">
        <v-list-item
          :active="session.id === selectedId"
          color="primary"
          :title="agentName(session.userId)"
          :subtitle="`${siteName(session.siteId)} · ${formatDateTime(session.inAt)} → ${session.outAt ? formatDateTime(session.outAt) : 'en cours'}`"
          @click="emit('select', session)"
        >
          <template #append>
            <v-chip :color="validationConfig[session.validation].color" variant="tonal" size="small">{{ validationConfig[session.validation].label }}</v-chip>
          </template>
        </v-list-item>
        <v-divider v-if="index < pagination.displayed.value.length - 1" />
      </template>
    </v-list>
    <AppEmptyState v-else-if="!loading" icon="mdi-clipboard-search-outline" title="Aucune session" description="Aucune session ne correspond à ces filtres." />
    <AppTableFooter v-if="sessions.length" v-model:page="pagination.page.value" :page-count="pagination.pageCount.value" :start="pagination.start.value + 1" :end="pagination.end.value" :total="pagination.total.value" :label="hasNext ? 'sessions chargées' : 'sessions'" />
  </v-card>
</template>
