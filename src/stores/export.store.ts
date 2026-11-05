import { ref } from 'vue'
import { defineStore } from 'pinia'

import { exportService } from '@/Services/export.service'
import { apiErrorCode } from '@/utils/api-error'
import { openDownload } from '@/utils/download'
import { exportDownloadMessage, exportFailureMessage } from '@/utils/export-error'
import type { AssignmentExportRequest, ExportResponse } from '@/types/export'

/** Le fichier est produit en arrière-plan : on interroge son état toutes les secondes, deux minutes au plus. */
export const EXPORT_POLL_INTERVAL_MS = 1000
export const EXPORT_MAX_POLLS = 120

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const isInProgress = (item: ExportResponse) => item.status === 'PENDING' || item.status === 'RUNNING'

export const useExportStore = defineStore('export', () => {
  const isExporting = ref(false)

  /**
   * Export en trois temps : demande (202), suivi jusqu'à READY, puis téléchargement par URL signée.
   * Les échecs sont levés avec un message français prêt à afficher.
   */
  async function exportAssignments(payload: AssignmentExportRequest): Promise<ExportResponse> {
    if (isExporting.value) throw new Error('Un export est déjà en cours.')
    isExporting.value = true
    try {
      let current = await exportService.requestAssignments(payload)
      for (let polls = 0; isInProgress(current) && polls < EXPORT_MAX_POLLS; polls += 1) {
        await wait(EXPORT_POLL_INTERVAL_MS)
        current = await exportService.findOne(current.id)
      }
      if (current.status === 'FAILED') throw new Error(exportFailureMessage(current.errorCode))
      if (current.status !== 'READY') throw new Error('Le fichier met trop de temps à être produit. Réessayez avec des filtres plus étroits.')
      await download(current)
      return current
    } finally {
      isExporting.value = false
    }
  }

  async function download(item: ExportResponse) {
    try {
      const { url, filename } = await exportService.download(item.id)
      openDownload(url, filename)
    } catch (error) {
      const code = apiErrorCode(error)
      const message = exportDownloadMessage(code)
      throw message ? new Error(message) : error
    }
  }

  return { isExporting, exportAssignments }
})
