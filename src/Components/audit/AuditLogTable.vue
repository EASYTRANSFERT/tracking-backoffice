<script setup lang="ts">
import { auditActionLabel, auditOutcomeConfig, formatAuditDate, parseAuditTarget } from '@/Components/audit/audit-format'
import type { AuditLogResponse } from '@/types/audit'

withDefaults(defineProps<{
  logs: AuditLogResponse[]
  actorName: (log: AuditLogResponse) => string
  tenantName?: (tenantId: string) => string | null
  showTenant?: boolean
}>(), { showTenant: false })

const emit = defineEmits<{ view: [log: AuditLogResponse] }>()
</script>

<template>
  <div class="overflow-x-auto">
    <v-table hover density="comfortable" class="min-w-[960px]">
      <thead>
        <tr>
          <th class="w-44">Date et heure</th>
          <th>Action</th>
          <th>Ressource</th>
          <th>Auteur</th>
          <th v-if="showTenant">Entreprise</th>
          <th class="w-32">Résultat</th>
          <th class="w-12"><span class="sr-only">Détail</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id" class="cursor-pointer" @click="emit('view', log)">
          <td class="text-sm whitespace-nowrap text-[#535865]">{{ formatAuditDate(log.at) }}</td>
          <td>
            <p class="font-semibold text-[#292d38]">{{ auditActionLabel(log.action) }}</p>
            <p v-if="auditActionLabel(log.action) !== log.action" class="font-mono text-[11px] text-[#848484]">{{ log.action }}</p>
          </td>
          <td class="text-sm">
            <span class="font-medium text-[#535865]">{{ parseAuditTarget(log.target).typeLabel }}</span>
            <p class="max-w-[220px] truncate font-mono text-[11px] text-[#848484]" :title="parseAuditTarget(log.target).id">{{ parseAuditTarget(log.target).id }}</p>
          </td>
          <td class="text-sm text-[#535865]">
            <span class="inline-flex items-center gap-1">
              <v-icon v-if="!log.actorId" icon="mdi-robot-outline" size="16" />
              {{ actorName(log) }}
              <v-icon v-if="log.deviceId" icon="mdi-cellphone" size="14" color="secondary" title="Depuis l’application mobile" />
            </span>
          </td>
          <td v-if="showTenant" class="text-sm text-[#535865]">
            <span v-if="tenantName?.(log.tenantId)">{{ tenantName(log.tenantId) }}</span>
            <span v-else class="font-mono text-xs text-[#848484]">{{ log.tenantId }}</span>
          </td>
          <td>
            <v-chip :color="auditOutcomeConfig(log.outcome).color" :prepend-icon="auditOutcomeConfig(log.outcome).icon" size="small" variant="tonal">
              {{ auditOutcomeConfig(log.outcome).label }}
            </v-chip>
          </td>
          <td><v-icon icon="mdi-chevron-right" color="secondary" /></td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
