<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import DeviceEnrollButton from '@/Components/devices/DeviceEnrollButton.vue'
import DeviceRevokeDialog from '@/Components/devices/DeviceRevokeDialog.vue'
import DeviceTable from '@/Components/devices/DeviceTable.vue'
import { deviceStatusOptions } from '@/Components/devices/device-format'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useDeviceRevocation } from '@/composables/useDeviceRevocation'
import { getApiErrorMessage } from '@/Services/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useDeviceStore } from '@/stores/device.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { ApiDeviceStatus, DeviceResponse } from '@/types/device'

const router = useRouter()
const store = useDeviceStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { devices, hasMore, isLoading, isLoadingMore } = storeToRefs(store)
const revocation = useDeviceRevocation()
const userId = ref<string | null>(store.filters.userId ?? null)
const status = ref<ApiDeviceStatus | null>(store.filters.status ?? null)
const agentOptions = computed(() => administratorStore.teamDirectoryUsers.map((user) => ({ title: `${user.firstName} ${user.lastName}`, value: user.id })))

async function load() {
  try {
    await store.loadDevices({ userId: userId.value ?? undefined, status: status.value ?? undefined })
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les appareils.'))
  }
}

async function loadMore() {
  try { await store.loadMore() } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger la suite.')) }
}

const view = (device: DeviceResponse) => router.push({ name: 'admin-device-details', params: { deviceId: device.id } })

watch([userId, status], load)
onMounted(() => {
  void load()
  administratorStore.loadDirectory().catch(() => feedback.warning('Les noms des agents n’ont pas pu être chargés.'))
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Appareils</template>
      <template #description>Téléphones enregistrés par les agents pour pointer. Révoquez un appareil perdu, volé ou remplacé.</template>
      <template #actions><DeviceEnrollButton /></template>
    </PageHeader>
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />
    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        <div>
          <h2 class="text-lg font-bold text-[#252830]">Parc d’appareils</h2>
          <p class="mt-1 text-xs text-[#747985]">Un appareil s’ajoute avec un code d’activation saisi dans l’application mobile.</p>
        </div>
        <v-spacer />
        <div class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_220px] lg:max-w-[560px]">
          <v-autocomplete v-model="userId" :items="agentOptions" placeholder="Tous les agents" prepend-inner-icon="mdi-account-search-outline" density="compact" hide-details clearable />
          <v-select v-model="status" :items="deviceStatusOptions" placeholder="Tous les statuts" density="compact" hide-details clearable />
        </div>
      </div>
      <v-divider />
      <DeviceTable v-if="devices.length" :devices="devices" :agent-name="store.agentName" @view="view" @revoke="revocation.open" />
      <AppEmptyState v-else-if="!isLoading" icon="mdi-cellphone-off" title="Aucun appareil trouvé" description="Enrôlez un appareil pour qu’un agent puisse pointer depuis son téléphone." />
      <div v-if="hasMore" class="flex justify-center border-t px-5 py-4">
        <v-btn variant="outlined" color="secondary" prepend-icon="mdi-chevron-down" :loading="isLoadingMore" @click="loadMore">Charger plus</v-btn>
      </div>
    </v-card>
    <DeviceRevokeDialog :device="revocation.target.value" :agent-name="revocation.targetAgentName.value" :loading="revocation.isRevoking.value" :error-message="revocation.errorMessage.value" @submit="revocation.submit" @cancel="revocation.close" />
  </div>
</template>
