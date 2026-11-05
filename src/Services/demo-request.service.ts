import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { DemoRequestListQuery, DemoRequestPageResponse, DemoRequestResponse, UpdateDemoRequestRequest } from '@/types/demo-request'

/** Demandes de démo reçues depuis le site public ; opérateur uniquement. */
export const demoRequestService = {
  /** Les plus récentes d'abord. */
  async list(query: DemoRequestListQuery = {}): Promise<DemoRequestPageResponse> {
    const response = await apiClient.get<DemoRequestPageResponse>('/platform/demo-requests', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<DemoRequestResponse> {
    const response = await apiClient.get<DemoRequestResponse>(`/platform/demo-requests/${id}`)
    return response.data
  },

  /** Chaque valeur modifiée est gardée dans `history`, avec son auteur et sa date. */
  async update(id: string, payload: UpdateDemoRequestRequest): Promise<DemoRequestResponse> {
    const response = await apiClient.patch<DemoRequestResponse>(`/platform/demo-requests/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
