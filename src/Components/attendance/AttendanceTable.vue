<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import type { AttendanceIssue, AttendanceSession, AttendanceStatus } from '@/types/attendance'

const props = defineProps<{ sessions: AttendanceSession[] }>()
const emit = defineEmits<{ review: [session: AttendanceSession] }>()

const query = ref('')
const status = ref<AttendanceStatus | 'all'>('all')
const date = ref('')
const page = ref(1)
const pageSize = 8

const issueLabels: Record<AttendanceIssue, string> = {
  outOfZone: 'Hors zone', outsideAssignment: 'Hors affectation', lowAccuracy: 'Précision faible',
  suspect: 'Suspect', missingExit: 'Sortie manquante',
}
const statusConfig: Record<AttendanceStatus, { label: string; color: string }> = {
  pending: { label: 'À valider', color: 'warning' }, validated: { label: 'Validé', color: 'success' },
  rejected: { label: 'Rejeté', color: 'error' }, missingExit: { label: 'Sortie manquante', color: 'warning' },
}

const filtered = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase('fr')
  return props.sessions.filter((session) =>
    (!normalized || `${session.agentName} ${session.siteName}`.toLocaleLowerCase('fr').includes(normalized)) &&
    (status.value === 'all' || session.status === status.value) &&
    (!date.value || session.clockInAt.slice(0, 10) === date.value),
  )
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const start = computed(() => (page.value - 1) * pageSize)
const displayed = computed(() => filtered.value.slice(start.value, start.value + pageSize))

watch([query, status, date], () => { page.value = 1 })

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : 'Non renseignée'
}
</script>

<template>
  <v-card>
    <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 class="text-xl font-bold">File de validation</h2><p class="mt-1 text-sm text-[#747985]">Filtrez et traitez les sessions présentant un écart.</p></div>
      <div class="grid gap-3 sm:grid-cols-3 lg:w-[760px]">
        <v-text-field v-model="query" label="Agent ou site" prepend-inner-icon="mdi-magnify" hide-details clearable />
        <v-select v-model="status" label="Statut" hide-details :items="[{title:'Tous les statuts',value:'all'},{title:'À valider',value:'pending'},{title:'Sortie manquante',value:'missingExit'},{title:'Validé',value:'validated'},{title:'Rejeté',value:'rejected'}]" />
        <v-text-field v-model="date" type="date" label="Date" hide-details clearable />
      </div>
    </div>
    <v-divider />

    <div v-if="filtered.length" class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="text-left text-sm text-[#747985]"><th class="px-6 py-4">Agent</th><th class="px-6 py-4">Site</th><th class="px-6 py-4">Entrée</th><th class="px-6 py-4">Sortie</th><th class="px-6 py-4">Écart</th><th class="px-6 py-4">Statut</th><th class="px-6 py-4 text-right">Action</th></tr></thead>
        <tbody>
          <tr v-for="session in displayed" :key="session.id" class="border-t border-[#ececef]">
            <td class="px-6 py-4 font-semibold">{{ session.agentName }}</td>
            <td class="px-6 py-4 text-sm text-[#535865]">{{ session.siteName }}</td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[#535865]">{{ formatDate(session.clockInAt) }}</td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-[#535865]">{{ formatDate(session.clockOutAt) }}</td>
            <td class="px-6 py-4"><v-chip size="small" color="warning" variant="tonal">{{ issueLabels[session.issue] }}</v-chip></td>
            <td class="px-6 py-4"><v-chip size="small" :color="statusConfig[session.status].color" variant="tonal">{{ statusConfig[session.status].label }}</v-chip></td>
            <td class="px-6 py-4 text-right"><v-btn v-if="['pending','missingExit'].includes(session.status)" size="small" color="primary" variant="tonal" @click="emit('review', session)">Examiner</v-btn><span v-else class="text-xs text-[#848484]">Traitée</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppEmptyState v-else icon="mdi-clock-check-outline" title="Aucun pointage à afficher" description="Aucune session ne correspond aux filtres sélectionnés." />
    <AppTableFooter v-if="filtered.length" :page="page" :page-count="pageCount" :start="start + 1" :end="Math.min(start + pageSize, filtered.length)" :total="filtered.length" label="sessions" @update:page="page = $event" />
  </v-card>
</template>
