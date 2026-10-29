import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/auth.store'

/** Les pages Périodes servent l'administrateur (gestion) et le superviseur (consultation seule). */
export function usePeriodAccess() {
  const { activeRole } = storeToRefs(useAuthStore())
  const readonly = computed(() => activeRole.value === 'supervisor')
  const listRoute = computed(() => (readonly.value ? 'supervisor-periods' : 'admin-periods'))
  const detailsRoute = computed(() => (readonly.value ? 'supervisor-period-details' : 'admin-period-details'))

  return { readonly, listRoute, detailsRoute }
}
