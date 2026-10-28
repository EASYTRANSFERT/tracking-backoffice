import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { CheckCampaignResponse, CheckListQuery, CheckPageResponse, TriggerCheckRequest } from '@/types/check'

/** Contrôles de présence d'une équipe : lancement et suivi des réponses. */
export const checkService = {
  async list(query: CheckListQuery = {}): Promise<CheckPageResponse> {
    const response = await apiClient.get<CheckPageResponse>('/checks', { params: query })
    return response.data
  },

  async trigger(payload: TriggerCheckRequest): Promise<CheckCampaignResponse> {
    const response = await apiClient.post<CheckCampaignResponse>('/checks/trigger', payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
