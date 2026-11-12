<script setup lang="ts">
import { computed } from 'vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import { auditActionLabel, auditOutcomeConfig, formatAuditDate, parseAuditTarget } from '@/Components/audit/audit-format'
import type { AuditLogResponse } from '@/types/audit'

const props = withDefaults(defineProps<{
  logs: AuditLogResponse[]
  actorName: (log: AuditLogResponse) => string
  tenantName?: (tenantId: string) => string | null
  showTenant?: boolean
}>(), { showTenant: false })

const emit = defineEmits<{ view: [log: AuditLogResponse] }>()

const cell = 'text-sm text-[#535865]'
const columns = computed<AppDataTableColumn[]>(() => [
  { key: 'at', title: 'Date et heure', class: 'w-44', cellClass: `${cell} whitespace-nowrap` },
  { key: 'action', title: 'Action' },
  { key: 'target', title: 'Ressource', cellClass: 'text-sm' },
  { key: 'actor', title: 'Auteur', cellClass: cell },
  { key: 'tenant', title: 'Entreprise', cellClass: cell, show: props.showTenant },
  { key: 'outcome', title: 'Résultat', class: 'w-32' },
  { key: 'detail', title: 'Détail', class: 'w-12', srOnly: true },
])
</script>

<template>
  <!-- La pagination est celle du serveur (curseur) : le pied de page reste dans la page. -->
  <AppDataTable bare clickable :paginate="false" :items="logs" :columns="columns" table-class="min-w-[960px]" density="comfortable" @click:row="emit('view', $event)">
    <template #cell-at="{ item: log }">{{ formatAuditDate(log.at) }}</template>
    <template #cell-action="{ item: log }">
      <p class="font-semibold text-[#292d38]">{{ auditActionLabel(log.action) }}</p>
      <p v-if="auditActionLabel(log.action) !== log.action" class="font-mono text-[11px] text-[#848484]">{{ log.action }}</p>
    </template>
    <template #cell-target="{ item: log }">
      <span class="font-medium text-[#535865]">{{ parseAuditTarget(log.target).typeLabel }}</span>
      <p class="max-w-[220px] truncate font-mono text-[11px] text-[#848484]" :title="parseAuditTarget(log.target).id">{{ parseAuditTarget(log.target).id }}</p>
    </template>
    <template #cell-actor="{ item: log }">
      <span class="inline-flex items-center gap-1">
        <v-icon v-if="!log.actorId" icon="mdi-robot-outline" size="16" />
        {{ actorName(log) }}
        <v-icon v-if="log.deviceId" icon="mdi-cellphone" size="14" color="secondary" title="Depuis l’application mobile" />
      </span>
    </template>
    <template #cell-tenant="{ item: log }">
      <span v-if="tenantName?.(log.tenantId)">{{ tenantName(log.tenantId) }}</span>
      <span v-else class="font-mono text-xs text-[#848484]">{{ log.tenantId }}</span>
    </template>
    <template #cell-outcome="{ item: log }">
      <v-chip :color="auditOutcomeConfig(log.outcome).color" :prepend-icon="auditOutcomeConfig(log.outcome).icon" size="small" variant="tonal">{{ auditOutcomeConfig(log.outcome).label }}</v-chip>
    </template>
    <template #cell-detail><v-icon icon="mdi-chevron-right" color="secondary" /></template>
  </AppDataTable>
</template>
