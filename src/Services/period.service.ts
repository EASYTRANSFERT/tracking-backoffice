import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  ClosePeriodRequest,
  CreatePeriodRequest,
  PeriodListQuery,
  PeriodPageResponse,
  PeriodResponse,
  ReopenPeriodRequest,
} from '@/types/period'

/** Périodes de validation et de clôture des pointages. */
export const periodService = {
  async list(query: PeriodListQuery = {}): Promise<PeriodPageResponse> {
    const response = await apiClient.get<PeriodPageResponse>('/periods', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<PeriodResponse> {
    const response = await apiClient.get<PeriodResponse>(`/periods/${id}`)
    return response.data
  },

  async create(payload: CreatePeriodRequest): Promise<PeriodResponse> {
    const response = await apiClient.post<PeriodResponse>('/periods', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /** IN_VALIDATION → OPEN, motif obligatoire. */
  async reopen(id: string, payload: ReopenPeriodRequest): Promise<PeriodResponse> {
    const response = await apiClient.post<PeriodResponse>(`/periods/${id}/reopen`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /**
   * Clôture asynchrone (202) : la période passe CLOSING puis CLOSED. Exige un step-up TOTP récent ;
   * skipAuthRefresh : un refus ici signifie « ré-authentification requise », pas une session expirée.
   */
  async close(id: string, payload: ClosePeriodRequest): Promise<PeriodResponse> {
    const response = await apiClient.post<PeriodResponse>(`/periods/${id}/close`, payload, {
      headers: idempotencyHeaders(),
      skipAuthRefresh: true,
    })
    return response.data
  },
}
