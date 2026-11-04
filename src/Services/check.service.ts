import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CheckCampaignResponse, CheckListQuery, CheckPageResponse, CheckScheduleResponse, CheckSelfieResponse,
  CreateCheckScheduleRequest, TriggerCheckRequest, UpdateCheckScheduleRequest,
} from '@/types/check'

/** Contrôles de présence d'une équipe : lancement et suivi des réponses. */
export const checkService = {
  async list(query: CheckListQuery = {}): Promise<CheckPageResponse> {
    const response = await apiClient.get<CheckPageResponse>('/checks', { params: query })
    return response.data
  },

  /** Chaque consultation est journalisée côté API : à n'appeler que sur demande explicite. */
  async getSelfie(id: string): Promise<CheckSelfieResponse> {
    const response = await apiClient.get<CheckSelfieResponse>(`/checks/${id}/selfie`)
    return response.data
  },

  async trigger(payload: TriggerCheckRequest): Promise<CheckCampaignResponse> {
    const response = await apiClient.post<CheckCampaignResponse>('/checks/trigger', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /** Tous les programmes de l'entreprise (non paginé), les plus récents d'abord. */
  async listSchedules(): Promise<CheckScheduleResponse[]> {
    const response = await apiClient.get<CheckScheduleResponse[]>('/checks/schedules')
    return response.data
  },

  async createSchedule(payload: CreateCheckScheduleRequest): Promise<CheckScheduleResponse> {
    const response = await apiClient.post<CheckScheduleResponse>('/checks/schedules', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async updateSchedule(id: string, payload: UpdateCheckScheduleRequest): Promise<CheckScheduleResponse> {
    const response = await apiClient.patch<CheckScheduleResponse>(`/checks/schedules/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /** Les contrôles déjà lancés par le programme restent. */
  async removeSchedule(id: string): Promise<void> {
    await apiClient.delete(`/checks/schedules/${id}`, { headers: idempotencyHeaders() })
  },
}
