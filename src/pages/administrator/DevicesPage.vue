<script setup lang="ts">
import { fullName } from '@/utils/people'
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import DeviceRevokeDialog from '@/Components/devices/DeviceRevokeDialog.vue'
import DeviceTable from '@/Components/devices/DeviceTable.vue'
import { deviceStatusOptions } from '@/Components/devices/device-format'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useDeviceRevocation } from '@/composables/useDeviceRevocation'
import { usePagination } from '@/composables/usePagination'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useDeviceStore } from '@/stores/device.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { ApiDeviceStatus, DeviceResponse } from '@/types/device'

const router = useRouter()
const store = useDeviceStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { devices, hasMore, isLoading } = storeToRefs(store)
watch(devices, (list) => { administratorStore.ensureUsers(list.map((device) => device.userId)).catch(() => undefined) })
const revocation = useDeviceRevocation()
const userId = ref<string | null>(store.filters.userId ?? null)
const status = ref<ApiDeviceStatus | null>(store.filters.status ?? null)
const pagination = usePagination(devices)
// Les appareils arrivent par lots de l'API : arrivé sur la dernière page chargée, on charge le lot suivant.
watch([pagination.page, pagination.pageCount], ([page, count]) => { if (page === count && hasMore.value) void loadMore() })
const agentOptions = computed(() => administratorStore.teamDirectoryUsers.map((user) => ({ title: fullName(user), value: user.id })))

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

watch([userId, status], () => { pagination.page.value = 1; void load() })
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
    </PageHeader>
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />
    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        <div>
          <h2 class="text-lg font-bold text-[#252830]">Parc d’appareils</h2>
          <p class="mt-1 text-xs text-[#747985]">Un appareil s’ajoute depuis l’application mobile, lors de l’activation de l’agent.</p>
        </div>
        <v-spacer />
        <div class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_220px] lg:max-w-[560px]">
          <v-autocomplete v-model="userId" :items="agentOptions" placeholder="Tous les agents" prepend-inner-icon="mdi-account-search-outline" density="compact" hide-details clearable />
          <v-select v-model="status" :items="deviceStatusOptions" placeholder="Tous les statuts" density="compact" hide-details clearable />
        </div>
      </div>
      <v-divider />
      <DeviceTable v-if="devices.length" :devices="pagination.displayed.value" :agent-name="store.agentName" @view="view" @revoke="revocation.open" />
      <AppEmptyState v-else-if="!isLoading" icon="mdi-cellphone-off" title="Aucun appareil trouvé" description="Les appareils apparaissent ici dès qu’un agent active l’application mobile." />
      <AppTableFooter v-if="devices.length" v-model:page="pagination.page.value" :page-count="pagination.pageCount.value" :start="pagination.start.value + 1" :end="pagination.end.value" :total="pagination.total.value" :label="hasMore ? 'appareils chargés' : 'appareils'" />
    </v-card>
    <DeviceRevokeDialog :device="revocation.target.value" :agent-name="revocation.targetAgentName.value" :loading="revocation.isRevoking.value" :error-message="revocation.errorMessage.value" @submit="revocation.submit" @cancel="revocation.close" />
  </div>
</template>
