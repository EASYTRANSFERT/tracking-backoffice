import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateMissionRequest,
  MissionListQuery,
  MissionPageResponse,
  MissionResponse,
  UpdateMissionRequest,
} from '@/types/mission'

export const missionService = {
  async list(query: MissionListQuery = {}): Promise<MissionPageResponse> {
    const response = await apiClient.get<MissionPageResponse>('/missions', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<MissionResponse> {
    const response = await apiClient.get<MissionResponse>(`/missions/${id}`)
    return response.data
  },

  async create(payload: CreateMissionRequest): Promise<MissionResponse> {
    const response = await apiClient.post<MissionResponse>('/missions', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async update(id: string, payload: UpdateMissionRequest): Promise<MissionResponse> {
    const response = await apiClient.patch<MissionResponse>(`/missions/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async open(id: string): Promise<MissionResponse> {
    const response = await apiClient.post<MissionResponse>(`/missions/${id}/open`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },

  async close(id: string): Promise<MissionResponse> {
    const response = await apiClient.post<MissionResponse>(`/missions/${id}/close`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },
}
