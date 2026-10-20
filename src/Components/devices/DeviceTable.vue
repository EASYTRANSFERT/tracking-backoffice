<script setup lang="ts">
import DeviceStatusChip from '@/Components/devices/DeviceStatusChip.vue'
import { deviceSystem, deviceTitle, formatDeviceDate } from '@/Components/devices/device-format'
import type { DeviceResponse } from '@/types/device'

withDefaults(defineProps<{ devices: DeviceResponse[]; agentName: (userId: string) => string | null; showAgent?: boolean }>(), { showAgent: true })
const emit = defineEmits<{ view: [device: DeviceResponse]; revoke: [device: DeviceResponse] }>()
</script>

<template>
  <div class="overflow-x-auto">
    <v-table hover class="min-w-[860px]">
      <thead>
        <tr>
          <th>Appareil</th>
          <th v-if="showAgent">Agent</th>
          <th>Application</th>
          <th>Intégrité</th>
          <th>Dernière activité</th>
          <th>Statut</th>
          <th class="w-16"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="device in devices" :key="device.id" class="cursor-pointer" @click="emit('view', device)">
          <td>
            <div class="flex min-h-16 items-center gap-3">
              <v-avatar color="red-lighten-5" rounded="lg"><v-icon :icon="device.platform === 'ios' ? 'mdi-apple-ios' : 'mdi-android'" color="primary" /></v-avatar>
              <div>
                <p class="font-semibold text-[#292d38]">{{ deviceTitle(device) }}</p>
                <p class="text-xs text-[#848484]">{{ deviceSystem(device) }}</p>
              </div>
            </div>
          </td>
          <td v-if="showAgent" class="text-sm text-[#535865]">
            <template v-if="agentName(device.userId)">{{ agentName(device.userId) }}</template>
            <span v-else class="font-mono text-xs text-[#848484]" :title="device.userId">{{ device.userId }}</span>
          </td>
          <td class="text-sm text-[#535865]">{{ device.appVersion ? `v${device.appVersion}` : '—' }}</td>
          <td class="text-sm text-[#535865]">
            <span>{{ device.lastIntegrityVerdict ?? 'Non vérifiée' }}</span>
            <v-icon v-if="device.hasKeyAttestation" icon="mdi-shield-check-outline" size="16" color="success" class="ml-1" title="Clé attestée par le matériel" />
          </td>
          <td class="text-sm text-[#535865]">{{ formatDeviceDate(device.lastSeenAt) }}</td>
          <td><DeviceStatusChip :status="device.status" /></td>
          <td @click.stop>
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
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
