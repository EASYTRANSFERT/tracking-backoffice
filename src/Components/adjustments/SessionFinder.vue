<script setup lang="ts">
import { computed, reactive } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import { formatDateTime, statusLabels, validationConfig } from '@/Components/attendance/attendance-labels'
import { addDays, fromDayKey } from '@/Components/sites/site-schedule'
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
const validationOptions = Object.entries(validationConfig).map(([value, { label }]) => ({ value, title: label }))
const agentOptions = computed(() => props.agents.map((agent) => ({ value: agent.id, title: `${fullName(agent)} · ${agent.employeeNumber}` })))

// L'API borne l'entrée : `from` inclus, `to` exclu. Le champ « Au » est une journée incluse : on prend le lendemain.
const startOf = (day: string) => fromDayKey(day).toISOString()

function search() {
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

function reset() {
  Object.assign(filters, { userId: null, siteId: null, from: '', to: '', status: null, validation: null, flagged: false })
  search()
}
</script>

<template>
  <v-card class="overflow-hidden">
    <v-card-title class="px-6 py-5">Trouver la session</v-card-title>
    <v-divider />
    <v-form class="space-y-3 px-6 py-5" @submit.prevent="search">
      <v-autocomplete v-model="filters.userId" :items="agentOptions" label="Agent" placeholder="Rechercher un agent" prepend-inner-icon="mdi-magnify" clearable hide-details no-data-text="Aucun agent ne correspond." />
      <v-autocomplete v-model="filters.siteId" :items="sites" item-title="name" item-value="id" label="Site" clearable hide-details no-data-text="Aucun site ne correspond." />
      <div class="grid grid-cols-2 gap-3">
        <v-text-field v-model="filters.from" type="date" label="Du" hide-details />
        <v-text-field v-model="filters.to" type="date" label="Au" hide-details />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <v-select v-model="filters.status" :items="statusOptions" label="Statut" clearable hide-details />
        <v-select v-model="filters.validation" :items="validationOptions" label="Validation" clearable hide-details />
      </div>
      <v-switch v-model="filters.flagged" color="primary" density="compact" hide-details label="Seulement les sessions avec anomalie" />
      <div class="flex justify-end gap-2">
        <v-btn variant="text" :disabled="loading" @click="reset">Réinitialiser</v-btn>
        <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-magnify" :loading="loading">Rechercher</v-btn>
      </div>
    </v-form>
    <v-divider />
    <v-list v-if="sessions.length" class="py-0" lines="two">
      <template v-for="(session, index) in sessions" :key="session.id">
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
        <v-divider v-if="index < sessions.length - 1" />
      </template>
    </v-list>
    <AppEmptyState v-else-if="!loading" icon="mdi-clipboard-search-outline" title="Aucune session" description="Aucune session ne correspond à ces filtres." />
    <div v-if="hasNext" class="flex justify-center border-t px-6 py-3">
      <v-btn variant="text" color="primary" :loading="loading" @click="emit('loadMore')">Charger plus</v-btn>
    </div>
  </v-card>
</template>
