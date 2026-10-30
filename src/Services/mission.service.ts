import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  AssignMissionSupervisorRequest,
  CreateMissionRequest,
  MissionListQuery,
  MissionOverviewQuery,
  MissionOverviewResponse,
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

  /** Change le superviseur de la mission (compte SUPERVISOR actif). */
  async assignSupervisor(id: string, payload: AssignMissionSupervisorRequest): Promise<MissionResponse> {
    const response = await apiClient.put<MissionResponse>(`/missions/${id}/supervisor`, payload, { headers: idempotencyHeaders() })
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

  /** Vue d'ensemble : sites aujourd'hui, et périodes des équipes de la mission. Aucun total de mission, volontairement. */
  async overview(id: string, query: MissionOverviewQuery = {}): Promise<MissionOverviewResponse> {
    const response = await apiClient.get<MissionOverviewResponse>(`/missions/${id}/overview`, { params: query })
    return response.data
  },
}
