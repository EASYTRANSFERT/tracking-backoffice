import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  DecideSessionRequest,
  SessionListQuery,
  SessionPageResponse,
  SessionSelfieResponse,
  WorkSessionResponse,
} from '@/types/attendance'

/** Sessions de travail (pointages) : suivi, selfie et décision. */
export const sessionService = {
  async list(query: SessionListQuery = {}): Promise<SessionPageResponse> {
    const response = await apiClient.get<SessionPageResponse>('/sessions', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<WorkSessionResponse> {
    const response = await apiClient.get<WorkSessionResponse>(`/sessions/${id}`)
    return response.data
  },

  /** Chaque consultation est journalisée côté API : à n'appeler que sur demande explicite. */
  async getSelfie(id: string): Promise<SessionSelfieResponse> {
    const response = await apiClient.get<SessionSelfieResponse>(`/sessions/${id}/selfie`)
    return response.data
  },

  async decide(id: string, payload: DecideSessionRequest): Promise<WorkSessionResponse> {
    const response = await apiClient.post<WorkSessionResponse>(`/sessions/${id}/decision`, payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
