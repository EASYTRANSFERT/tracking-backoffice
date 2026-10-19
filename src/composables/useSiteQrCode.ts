import { ref } from 'vue'

import { getApiErrorMessage } from '@/Services/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site } from '@/types/administrator'

export function useSiteQrCode() {
  const store = useAdministratorStore()
  const feedback = useUiFeedbackStore()
  const generatingId = ref<string | null>(null)

  // Chaque génération fait tourner le jeton : l'ancien QR code imprimé devient invalide.
  async function generate(site: Site) {
    if (site.qrRotatedAt) {
      const confirmed = await feedback.askConfirmation({
        title: 'Régénérer le QR code ?',
        message: `L’ancien QR code du site « ${site.name} » ne sera plus accepté pour le pointage.`,
        confirmText: 'Régénérer',
        color: 'error',
      })
      if (!confirmed) return
    }

    generatingId.value = site.id
    try {
      await store.regenerateQrCode(site.id)
      feedback.success('QR code généré.')
    } catch (error) {
      feedback.error(getApiErrorMessage(error, 'Impossible de générer le QR code.'))
    } finally {
      generatingId.value = null
    }
  }

  return { generatingId, generate }
}
