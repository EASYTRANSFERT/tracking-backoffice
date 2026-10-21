import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { deviceService } from '@/Services/device.service'
import { useAuthStore } from '@/stores/auth.store'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { ApiDeviceStatus, DeviceResponse } from '@/types/device'

const PAGE_SIZE = 50

export interface DeviceFilters {
  userId?: string
  status?: ApiDeviceStatus
}

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<DeviceResponse[]>([])
  const nextCursor = ref<string | null>(null)
  const filters = ref<DeviceFilters>({})
  const currentDevice = ref<DeviceResponse | null>(null)
  const devicesByUser = ref<Record<string, DeviceResponse[]>>({})
  /** null tant que le compteur n'a pas été chargé. */
  const pendingEnrollmentCount = ref<number | null>(null)
  const hasMorePendingEnrollments = ref(false)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const isDeviceLoading = ref(false)
  const isRevoking = ref(false)

  const hasMore = computed(() => nextCursor.value !== null)

  /** L'API ne renvoie que userId : le nom vient de l'annuaire déjà chargé. */
  function agentName(userId: string) {
    const user = useAdministratorStore().teamDirectoryUsers.find((item) => item.id === userId)
    return user ? `${user.firstName} ${user.lastName}` : null
  }

  async function loadDevices(nextFilters: DeviceFilters = filters.value) {
    filters.value = { ...nextFilters }
    isLoading.value = true
    try {
      const response = await deviceService.list({ ...activeFilters(), limit: PAGE_SIZE })
      devices.value = response.items
      nextCursor.value = response.nextCursor ?? null
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    if (!nextCursor.value || isLoadingMore.value) return
    isLoadingMore.value = true
    try {
      const response = await deviceService.list({ ...activeFilters(), cursor: nextCursor.value, limit: PAGE_SIZE })
      devices.value = [...devices.value, ...response.items]
      nextCursor.value = response.nextCursor ?? null
    } finally {
      isLoadingMore.value = false
    }
  }

  async function loadDevice(id: string) {
    isDeviceLoading.value = true
    try {
      currentDevice.value = await deviceService.findOne(id)
      return currentDevice.value
    } finally {
      isDeviceLoading.value = false
    }
  }

  async function loadUserDevices(userId: string) {
    const response = await deviceService.list({ userId, limit: 200 })
    devicesByUser.value = { ...devicesByUser.value, [userId]: response.items }
    return response.items
  }

  async function loadPendingEnrollmentCount() {
    const response = await deviceService.list({ status: 'PENDING_ENROLLMENT', limit: 200 })
    pendingEnrollmentCount.value = response.items.length
    hasMorePendingEnrollments.value = Boolean(response.nextCursor)
  }

  /** Step-up TOTP puis révocation : l'API exige une ré-authentification récente. */
  async function revokeDevice(id: string, reason: string, totpCode: string) {
    const authStore = useAuthStore()
    isRevoking.value = true
    try {
      await authStore.stepUp(totpCode)
      const revoked = await deviceService.revoke(id, { reason })
      replaceDevice(revoked)
      return revoked
    } finally {
      isRevoking.value = false
    }
  }

  function activeFilters() {
    return Object.fromEntries(Object.entries(filters.value).filter(([, value]) => Boolean(value))) as DeviceFilters
  }

  function replaceDevice(device: DeviceResponse) {
    devices.value = devices.value.map((item) => (item.id === device.id ? device : item))
    if (currentDevice.value?.id === device.id) currentDevice.value = device
    const userDevices = devicesByUser.value[device.userId]
    if (userDevices) {
      devicesByUser.value = {
        ...devicesByUser.value,
        [device.userId]: userDevices.map((item) => (item.id === device.id ? device : item)),
      }
    }
  }

  return {
    devices, nextCursor, filters, currentDevice, devicesByUser, pendingEnrollmentCount, hasMorePendingEnrollments,
    isLoading, isLoadingMore, isDeviceLoading, isRevoking, hasMore,
    agentName, loadDevices, loadMore, loadDevice, loadUserDevices, loadPendingEnrollmentCount, revokeDevice,
  }
})
