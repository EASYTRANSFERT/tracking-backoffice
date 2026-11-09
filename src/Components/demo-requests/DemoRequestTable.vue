<script setup lang="ts">
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import { formatAuditDate } from '@/Components/audit/audit-format'
import { demoRequestStatusConfig, formatDemoDate } from '@/Components/demo-requests/demo-request-format'
import type { DemoRequestResponse } from '@/types/demo-request'

defineProps<{ requests: DemoRequestResponse[] }>()
const emit = defineEmits<{ view: [request: DemoRequestResponse] }>()

const cell = 'text-sm text-[#535865]'
const columns: AppDataTableColumn[] = [
  { key: 'createdAt', title: 'Reçue le', class: 'w-40', cellClass: `${cell} whitespace-nowrap` },
  { key: 'contact', title: 'Contact' },
  { key: 'company', title: 'Entreprise', cellClass: `${cell} font-medium` },
  { key: 'email', title: 'Coordonnées', cellClass: cell },
  { key: 'demoAt', title: 'Démo', class: 'w-40', cellClass: `${cell} whitespace-nowrap` },
  { key: 'status', title: 'Statut', class: 'w-40' },
  { key: 'detail', title: 'Détail', class: 'w-12', srOnly: true },
]
</script>

<template>
  <!-- La pagination est celle du serveur (curseur) : le pied de page reste dans la page. -->
  <AppDataTable bare clickable :paginate="false" :items="requests" :columns="columns" table-class="min-w-[960px]" @click:row="emit('view', $event)">
    <template #cell-createdAt="{ item: request }">{{ formatAuditDate(request.createdAt) }}</template>
    <template #cell-contact="{ item: request }">
      <p class="font-semibold text-[#292d38]">{{ request.fullName }}</p>
      <p v-if="request.message" class="max-w-[260px] truncate text-xs text-[#848484]" :title="request.message">{{ request.message }}</p>
    </template>
    <template #cell-email="{ item: request }">
      <p>{{ request.email }}</p>
      <p v-if="request.phone" class="text-xs text-[#848484]">{{ request.phone }}</p>
    </template>
    <template #cell-demoAt="{ item: request }">{{ request.demoAt ? formatDemoDate(request.demoAt) : '—' }}</template>
    <template #cell-status="{ item: request }">
      <v-chip :color="demoRequestStatusConfig(request.status).color" :prepend-icon="demoRequestStatusConfig(request.status).icon" size="small" variant="tonal">{{ demoRequestStatusConfig(request.status).label }}</v-chip>
    </template>
    <template #cell-detail><v-icon icon="mdi-chevron-right" color="secondary" /></template>
  </AppDataTable>
</template>
