import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/auth.store'

/** La page Régularisations sert l'administrateur et le superviseur (sessions de son périmètre) ; seul le chemin change. */
export function useAdjustmentAccess() {
  const { activeRole } = storeToRefs(useAuthStore())
  const isSupervisor = computed(() => activeRole.value === 'supervisor')
  const adjustmentsRoute = computed(() => (isSupervisor.value ? 'supervisor-adjustments' : 'admin-adjustments'))

  return { isSupervisor, adjustmentsRoute }
}
