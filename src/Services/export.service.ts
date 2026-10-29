import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { AssignmentExportRequest, ExportDownloadResponse, ExportResponse } from '@/types/export'

/** Un export se fait en trois temps : demander (202), suivre l'état, puis télécharger une fois READY. */
export const exportService = {
  async requestAssignments(payload: AssignmentExportRequest): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>('/exports/assignments', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async findOne(id: string): Promise<ExportResponse> {
    const response = await apiClient.get<ExportResponse>(`/exports/${id}`)
    return response.data
  },

  /** Chaque appel est journalisé côté serveur (EXPORT_DOWNLOADED) : à n'appeler que sur action de l'utilisateur. */
  async download(id: string): Promise<ExportDownloadResponse> {
    const response = await apiClient.get<ExportDownloadResponse>(`/exports/${id}/download`)
    return response.data
  },
}
