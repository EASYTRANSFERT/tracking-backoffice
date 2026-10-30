import { isAxiosError } from 'axios'

import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  ClosePeriodRequest,
  CreatePeriodRequest,
  PeriodDailyPageResponse,
  PeriodDailyQuery,
  PeriodListQuery,
  PeriodPageResponse,
  PeriodReportFormat,
  PeriodResponse,
  PeriodTotalsResponse,
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

  /** Bilan : agents, équipe et sites. Provisoire (`period.final` false) tant que la période n'est pas clôturée. */
  async totals(id: string): Promise<PeriodTotalsResponse> {
    const response = await apiClient.get<PeriodTotalsResponse>(`/periods/${id}/totals`)
    return response.data
  },

  /** Détail jour par jour, d'un agent ou de toute l'équipe. */
  async dailyTotals(id: string, query: PeriodDailyQuery = {}): Promise<PeriodDailyPageResponse> {
    const response = await apiClient.get<PeriodDailyPageResponse>(`/periods/${id}/totals/daily`, { params: query })
    return response.data
  },

  /**
   * Fichier du bilan : la route exige le jeton, donc pas de simple lien. En cas d'échec, le corps d'erreur
   * (problem details) arrive lui aussi en blob : on le relit pour que `code` reste exploitable.
   */
  async report(id: string, format: PeriodReportFormat): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(`/periods/${id}/report`, { params: { format }, responseType: 'blob' })
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        error.response.data = await error.response.data.text().then((text) => JSON.parse(text) as unknown).catch(() => undefined)
      }
      throw error
    }
  },
}
