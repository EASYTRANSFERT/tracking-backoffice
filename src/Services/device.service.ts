import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateDeviceEnrollmentRequest,
  DeviceEnrollmentResponse,
  DeviceListQuery,
  DevicePageResponse,
  DeviceResponse,
  RevokeDeviceRequest,
} from '@/types/device'

export const deviceService = {
  async list(query: DeviceListQuery = {}): Promise<DevicePageResponse> {
    const response = await apiClient.get<DevicePageResponse>('/devices', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<DeviceResponse> {
    const response = await apiClient.get<DeviceResponse>(`/devices/${id}`)
    return response.data
  },

  /**
   * Exige un jeton issu d'un step-up TOTP récent. skipAuthRefresh : un 401 ici
   * signifie « ré-authentification requise », pas une session expirée.
   */
  async revoke(id: string, payload: RevokeDeviceRequest): Promise<DeviceResponse> {
    const response = await apiClient.post<DeviceResponse>(`/devices/${id}/revoke`, payload, {
      headers: idempotencyHeaders(),
      skipAuthRefresh: true,
    })
    return response.data
  },

  /** Mock uniquement : l'API ne fournit pas encore cet endpoint. */
  async createEnrollment(payload: CreateDeviceEnrollmentRequest): Promise<DeviceEnrollmentResponse> {
    const response = await apiClient.post<DeviceEnrollmentResponse>('/devices/enrollments', payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
