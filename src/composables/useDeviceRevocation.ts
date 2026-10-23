import { computed, ref } from 'vue'

import { getApiErrorMessage } from '@/utils/api-error'
import { useDeviceStore } from '@/stores/device.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { DeviceResponse } from '@/types/device'

/** État du dialogue de révocation, partagé par la liste, le détail et la fiche agent. */
export function useDeviceRevocation() {
  const store = useDeviceStore()
  const feedback = useUiFeedbackStore()
  const target = ref<DeviceResponse | null>(null)
  const errorMessage = ref<string | null>(null)
  const targetAgentName = computed(() => (target.value ? store.agentName(target.value.userId) : null))

  function open(device: DeviceResponse) {
    errorMessage.value = null
    target.value = device
  }

  function close() {
    target.value = null
  }

  async function submit(reason: string, code: string) {
    if (!target.value) return
    errorMessage.value = null
    try {
      await store.revokeDevice(target.value.id, reason, code)
      feedback.success('Appareil révoqué.')
      close()
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, 'Impossible de révoquer l’appareil.')
    }
  }

  return { target, targetAgentName, errorMessage, isRevoking: computed(() => store.isRevoking), open, close, submit }
}
