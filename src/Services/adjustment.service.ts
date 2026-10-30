import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { AdjustmentResponse, CreateAdjustmentRequest } from '@/types/adjustment'

/** Régularisations d'une session de travail : correction de l'entrée, de la sortie ou du retard, avec motif. */
export const adjustmentService = {
  async create(sessionId: string, payload: CreateAdjustmentRequest): Promise<AdjustmentResponse> {
    const response = await apiClient.post<AdjustmentResponse>(`/sessions/${sessionId}/adjustments`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /** De la plus ancienne à la plus récente. */
  async list(sessionId: string): Promise<AdjustmentResponse[]> {
    const response = await apiClient.get<AdjustmentResponse[]>(`/sessions/${sessionId}/adjustments`)
    return response.data
  },
}
