import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { DeviceListQuery, DevicePageResponse, DeviceReplacementRequest, DeviceReplacementResponse, DeviceResponse, RevokeDeviceRequest } from '@/types/device'

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

  /** Changement de téléphone : révoque l'appareil actif et remet le compte en attente d'activation (step-up TOTP requis). */
  async replaceForUser(userId: string, payload: DeviceReplacementRequest): Promise<DeviceReplacementResponse> {
    const response = await apiClient.post<DeviceReplacementResponse>(`/users/${userId}/device-replacement`, payload, {
      headers: idempotencyHeaders(),
      skipAuthRefresh: true,
    })
    return response.data
  },
}
