<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import DeviceRevokeDialog from '@/Components/devices/DeviceRevokeDialog.vue'
import DeviceStatusChip from '@/Components/devices/DeviceStatusChip.vue'
import { deviceSystem, deviceTitle, formatDeviceDate } from '@/Components/devices/device-format'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useDeviceRevocation } from '@/composables/useDeviceRevocation'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useDeviceStore } from '@/stores/device.store'

const route = useRoute()
const store = useDeviceStore()
const administratorStore = useAdministratorStore()
const { currentDevice, isDeviceLoading } = storeToRefs(store)
const revocation = useDeviceRevocation()
const loadError = ref<string | null>(null)
const deviceId = computed(() => route.params.deviceId as string)
const device = computed(() => (currentDevice.value?.id === deviceId.value ? currentDevice.value : null))
const agentName = computed(() => (device.value ? store.agentName(device.value.userId) : null))

const fields = computed(() => {
  const value = device.value
  if (!value) return []
  return [
    { label: 'Système', value: deviceSystem(value) || '—' },
    { label: 'Version de l’application', value: value.appVersion ? `v${value.appVersion}` : '—' },
    { label: 'Activé le', value: formatDeviceDate(value.enrolledAt) },
    { label: 'Dernière activité', value: formatDeviceDate(value.lastSeenAt) },
    { label: 'Dernier contrôle d’intégrité', value: value.lastIntegrityVerdict ? `${value.lastIntegrityVerdict} · ${formatDeviceDate(value.lastIntegrityAt)}` : 'Non vérifiée' },
    { label: 'Clé attestée par le matériel', value: value.hasKeyAttestation ? 'Oui' : 'Non' },
    { label: 'Empreinte de la clé', value: value.publicKeyHash ?? '—', mono: true },
    { label: 'Identifiant', value: value.id, mono: true },
  ]
})

onMounted(async () => {
  administratorStore.loadDirectory().catch(() => undefined)
  try {
    await store.loadDevice(deviceId.value)
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Impossible de charger cet appareil.')
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader>
      <template #title>{{ device ? deviceTitle(device) : 'Appareil' }}</template>
      <template #description>Informations techniques et état de l’appareil de pointage.</template>
      <template #actions><v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-devices' }">Retour</v-btn></template>
    </PageHeader>
    <v-progress-linear v-if="isDeviceLoading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="loadError" type="error" variant="tonal" :title="loadError" />
    <div v-else-if="device" class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <v-card>
        <v-card-title class="px-6 py-5">Caractéristiques</v-card-title>
        <v-divider />
        <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div v-for="field in fields" :key="field.label">
            <p class="text-xs text-[#848484]">{{ field.label }}</p>
            <p class="mt-1 break-all font-medium" :class="{ 'font-mono text-sm': field.mono }">{{ field.value }}</p>
          </div>
        </v-card-text>
      </v-card>
      <div class="space-y-6">
        <v-card>
          <v-card-text class="pa-6">
            <div class="flex items-center justify-between"><span class="font-bold">État</span><DeviceStatusChip :status="device.status" /></div>
            <v-divider class="my-5" />
            <p class="text-xs text-[#848484]">Agent</p>
            <RouterLink v-if="agentName" :to="{ name: 'admin-user-details', params: { userId: device.userId } }" class="mt-1 block font-medium text-[#D80F16]">{{ agentName }}</RouterLink>
            <p v-else class="mt-1 break-all font-mono text-sm">{{ device.userId }}</p>
            <template v-if="device.status === 'REVOKED'">
              <v-divider class="my-5" />
              <p class="text-xs text-[#848484]">Révoqué le</p>
              <p class="mt-1 font-medium">{{ formatDeviceDate(device.revokedAt) }}</p>
              <p class="mt-4 text-xs text-[#848484]">Motif</p>
              <p class="mt-1 text-sm">{{ device.revokedReason || '—' }}</p>
            </template>
            <template v-else>
              <v-divider class="my-5" />
              <v-btn block variant="tonal" color="error" prepend-icon="mdi-cellphone-remove" @click="revocation.open(device)">Révoquer l’appareil</v-btn>
            </template>
          </v-card-text>
        </v-card>
      </div>
    </div>
    <DeviceRevokeDialog :device="revocation.target.value" :agent-name="revocation.targetAgentName.value" :loading="revocation.isRevoking.value" :error-message="revocation.errorMessage.value" @submit="revocation.submit" @cancel="revocation.close" />
  </div>
</template>
