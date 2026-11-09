<script setup lang="ts">
import { computed } from 'vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import DeviceStatusChip from '@/Components/devices/DeviceStatusChip.vue'
import { deviceSystem, deviceTitle, formatDeviceDate } from '@/Components/devices/device-format'
import type { DeviceResponse } from '@/types/device'

const props = withDefaults(defineProps<{
  devices: DeviceResponse[]
  agentName: (userId: string) => string | null
  showAgent?: boolean
  /** Libellé du pied de tableau (« appareils chargés » tant que la liste est partielle). */
  label?: string
  /** Valeurs des filtres de la page : un changement ramène à la première page. */
  resetOn?: unknown[]
}>(), { showAgent: true, label: 'appareils' })
const emit = defineEmits<{ view: [device: DeviceResponse]; revoke: [device: DeviceResponse]; reachedEnd: [] }>()

const cell = 'text-sm text-[#535865]'
const columns = computed<AppDataTableColumn[]>(() => [
  { key: 'device', title: 'Appareil' },
  { key: 'agent', title: 'Agent', cellClass: cell, show: props.showAgent },
  { key: 'appVersion', title: 'Application', cellClass: cell },
  { key: 'integrity', title: 'Intégrité', cellClass: cell },
  { key: 'lastSeenAt', title: 'Dernière activité', cellClass: cell },
  { key: 'status', title: 'Statut' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true },
])
</script>

<template>
  <AppDataTable
    bare
    clickable
    :items="devices"
    :columns="columns"
    :label="label"
    :reset-on="resetOn"
    table-class="min-w-[860px]"
    @click:row="emit('view', $event)"
    @reached-end="emit('reachedEnd')"
  >
    <template #cell-device="{ item: device }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon :icon="device.platform === 'ios' ? 'mdi-apple-ios' : 'mdi-android'" color="primary" /></v-avatar>
        <div>
          <p class="font-semibold text-[#292d38]">{{ deviceTitle(device) }}</p>
          <p class="text-xs text-[#848484]">{{ deviceSystem(device) }}</p>
        </div>
      </div>
    </template>
    <template #cell-agent="{ item: device }">
      <template v-if="agentName(device.userId)">{{ agentName(device.userId) }}</template>
      <span v-else class="font-mono text-xs text-[#848484]" :title="device.userId">{{ device.userId }}</span>
    </template>
    <template #cell-appVersion="{ item: device }">{{ device.appVersion ? `v${device.appVersion}` : '—' }}</template>
    <template #cell-integrity="{ item: device }">
      <span>{{ device.lastIntegrityVerdict ?? 'Non vérifiée' }}</span>
      <v-icon v-if="device.hasKeyAttestation" icon="mdi-shield-check-outline" size="16" color="success" class="ml-1" title="Clé attestée par le matériel" />
    </template>
    <template #cell-lastSeenAt="{ item: device }">{{ formatDeviceDate(device.lastSeenAt) }}</template>
    <template #cell-status="{ item: device }"><DeviceStatusChip :status="device.status" /></template>
    <template #cell-actions="{ item: device }">
      <div @click.stop>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" aria-label="Actions" /></template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', device)" />
            <template v-if="device.status !== 'REVOKED'">
              <v-divider />
              <v-list-item prepend-icon="mdi-cellphone-remove" title="Révoquer" base-color="error" @click="emit('revoke', device)" />
            </template>
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
