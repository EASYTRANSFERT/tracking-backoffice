<script setup lang="ts">
import { computed } from 'vue'

import { auditActionLabel, auditOutcomeConfig, formatAuditDate, formatAuditValue, parseAuditTarget } from '@/Components/audit/audit-format'
import type { AuditLogResponse } from '@/types/audit'

const props = defineProps<{
  log: AuditLogResponse | null
  actorName: string
  tenantName?: string | null
  canOpenTarget?: boolean
}>()

const emit = defineEmits<{
  close: []
  openTarget: []
  filterTarget: [target: string]
  filterActor: [actorId: string]
}>()

const outcome = computed(() => props.log ? auditOutcomeConfig(props.log.outcome) : null)
const target = computed(() => props.log ? parseAuditTarget(props.log.target) : null)

/** Champs de before/after réunis, ceux qui ont changé en premier. */
const changes = computed(() => {
  const before = props.log?.before ?? {}
  const after = props.log?.after ?? {}
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .map((key) => {
      const previous = formatAuditValue(before[key])
      const next = formatAuditValue(after[key])
      return { key, previous, next, changed: previous !== next }
    })
    .sort((a, b) => Number(b.changed) - Number(a.changed))
})
const metadata = computed(() => {
  const value = props.log?.metadata
  return value && Object.keys(value).length ? JSON.stringify(value, null, 2) : null
})
</script>

<template>
  <v-dialog :model-value="Boolean(log)" max-width="760" @update:model-value="!$event && emit('close')">
    <v-card v-if="log && outcome && target">
      <v-card-title class="flex items-start justify-between gap-3 px-6 pt-5">
        <div>
          <p class="text-lg font-bold text-[#252830]">{{ auditActionLabel(log.action) }}</p>
          <p class="font-mono text-xs text-[#848484]">{{ log.action }}</p>
        </div>
        <v-chip :color="outcome.color" :prepend-icon="outcome.icon" size="small" variant="tonal">{{ outcome.label }}</v-chip>
      </v-card-title>
      <v-card-text class="px-6">
        <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
          <dt class="text-[#747985]">Date et heure</dt>
          <dd class="font-medium">{{ formatAuditDate(log.at) }}</dd>
          <dt class="text-[#747985]">Auteur</dt>
          <dd class="flex flex-wrap items-center gap-2">
            <span class="font-medium">{{ actorName }}</span>
            <span v-if="log.actorId" class="font-mono text-xs text-[#848484]">{{ log.actorId }}</span>
          </dd>
          <template v-if="log.deviceId">
            <dt class="text-[#747985]">Appareil</dt>
            <dd class="font-mono text-xs">{{ log.deviceId }}</dd>
          </template>
          <dt class="text-[#747985]">Ressource</dt>
          <dd><span class="font-medium">{{ target.typeLabel }}</span> <span class="font-mono text-xs text-[#848484]">{{ target.id }}</span></dd>
          <template v-if="tenantName !== undefined">
            <dt class="text-[#747985]">Entreprise</dt>
            <dd>{{ tenantName ?? log.tenantId }}</dd>
          </template>
          <template v-if="log.reason">
            <dt class="text-[#747985]">Motif</dt>
            <dd class="whitespace-pre-line">{{ log.reason }}</dd>
          </template>
          <template v-if="log.requestId">
            <dt class="text-[#747985]">Corrélation</dt>
            <dd class="font-mono text-xs">{{ log.requestId }}</dd>
          </template>
        </dl>

        <template v-if="changes.length">
          <h3 class="mt-6 mb-2 text-sm font-bold text-[#252830]">Modifications</h3>
          <v-table density="compact" class="rounded-lg border">
            <thead><tr><th>Champ</th><th>Avant</th><th>Après</th></tr></thead>
            <tbody>
              <tr v-for="change in changes" :key="change.key" :class="{ 'bg-amber-50': change.changed }">
                <td class="font-mono text-xs font-semibold">{{ change.key }}</td>
                <td class="font-mono text-xs break-all text-[#848484]">{{ change.previous }}</td>
                <td class="font-mono text-xs break-all">{{ change.next }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-if="metadata">
          <h3 class="mt-6 mb-2 text-sm font-bold text-[#252830]">Métadonnées</h3>
          <pre class="max-h-60 overflow-auto rounded-lg bg-[#f7f7f8] p-3 text-xs">{{ metadata }}</pre>
        </template>
      </v-card-text>
      <v-card-actions class="flex-wrap gap-2 px-6 pb-5">
        <v-btn v-if="canOpenTarget" variant="text" color="primary" prepend-icon="mdi-open-in-app" @click="emit('openTarget')">Ouvrir la ressource</v-btn>
        <v-btn variant="text" color="secondary" prepend-icon="mdi-filter-outline" @click="emit('filterTarget', log.target)">Actions sur cette ressource</v-btn>
        <v-btn v-if="log.actorId" variant="text" color="secondary" prepend-icon="mdi-account-filter-outline" @click="emit('filterActor', log.actorId)">Actions de cet auteur</v-btn>
        <v-spacer />
        <v-btn variant="outlined" color="secondary" @click="emit('close')">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
