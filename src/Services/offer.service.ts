import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { CreateOfferRequest, CursorPage, CursorQuery, OfferResponse } from '@/types/platform'

export const offerService = {
  async list(query: CursorQuery = {}): Promise<CursorPage<OfferResponse>> {
    const response = await apiClient.get<CursorPage<OfferResponse>>('/platform/offers', { params: query })
    return response.data
  },

  async create(payload: CreateOfferRequest): Promise<OfferResponse> {
    const response = await apiClient.post<OfferResponse>('/platform/offers', payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
