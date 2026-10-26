import { ref } from 'vue'

import { getApiErrorMessage } from '@/utils/api-error'
import { printQrCode } from '@/utils/print-qr-code'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site } from '@/types/administrator'

export function useSiteQrCode() {
  const store = useAdministratorStore()
  const feedback = useUiFeedbackStore()
  const generatingId = ref<string | null>(null)
  const printingId = ref<string | null>(null)

  // Chaque génération fait tourner le jeton : l'ancien QR code imprimé devient invalide.
  const confirmRotation = (site: Site, confirmText: string, intro = '') => feedback.askConfirmation({
    title: 'Régénérer le QR code ?',
    message: `${intro}L’ancien QR code du site « ${site.name} » ne sera plus accepté pour le pointage.`,
    confirmText,
    color: 'error',
  })

  async function rotate(site: Site): Promise<boolean> {
    try {
      await store.regenerateQrCode(site.id)
      return true
    } catch (error) {
      feedback.error(getApiErrorMessage(error, 'Impossible de générer le QR code.'))
      return false
    }
  }

  async function generate(site: Site) {
    if (site.qrRotatedAt && !(await confirmRotation(site, 'Régénérer'))) return
    generatingId.value = site.id
    try {
      if (await rotate(site)) feedback.success('QR code généré.')
    } finally {
      generatingId.value = null
    }
  }

  /**
   * L'API ne rend l'image qu'à la génération. Sans image en mémoire, il faut donc
   * (re)générer avant d'imprimer : sans confirmation la première fois, avec ensuite.
   */
  async function print(site: Site) {
    if (site.status === 'inactive') {
      feedback.warning('Ce site est archivé : son QR code n’est plus utilisable.')
      return
    }
    if (!site.qrImage && site.qrRotatedAt && !(await confirmRotation(site, 'Régénérer et imprimer', 'L’image du QR code n’est disponible qu’au moment de sa génération : pour l’imprimer, il faut en créer un nouveau. '))) return

    printingId.value = site.id
    try {
      if (!site.qrImage && !(await rotate(site))) return
      const current = store.getSiteById(site.id) ?? site
      if (!current.qrImage) {
        feedback.error('Le QR code n’a pas pu être récupéré pour l’impression.')
        return
      }
      await printQrCode({
        siteName: current.name,
        location: [current.address, current.city].filter(Boolean).join(', ') || current.locationDescription,
        image: current.qrImage,
        generatedAt: current.qrRotatedAt,
      })
    } finally {
      printingId.value = null
    }
  }

  return { generatingId, printingId, generate, print }
}
