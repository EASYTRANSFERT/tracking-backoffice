import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateSiteRequest,
  SiteListQuery,
  SitePageResponse,
  SiteQrCodeResponse,
  SiteResponse,
  UpdateSiteRequest,
} from '@/types/site'

export const siteService = {
  async list(query: SiteListQuery = {}): Promise<SitePageResponse> {
    const response = await apiClient.get<SitePageResponse>('/sites', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<SiteResponse> {
    const response = await apiClient.get<SiteResponse>(`/sites/${id}`)
    return response.data
  },

  async create(payload: CreateSiteRequest): Promise<SiteResponse> {
    const response = await apiClient.post<SiteResponse>('/sites', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async update(id: string, payload: UpdateSiteRequest): Promise<SiteResponse> {
    const response = await apiClient.patch<SiteResponse>(`/sites/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async archive(id: string): Promise<SiteResponse> {
    const response = await apiClient.post<SiteResponse>(`/sites/${id}/archive`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },

  async generateQrCode(id: string): Promise<SiteQrCodeResponse> {
    const response = await apiClient.post<SiteQrCodeResponse>(`/sites/${id}/qr-code`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },
}
