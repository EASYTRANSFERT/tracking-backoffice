import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type { AssignTeamLeadRequest, CreateTeamRequest, TeamListQuery, TeamMembersRequest, TeamPageResponse, TeamResponse, UpdateTeamRequest } from '@/types/team'

export const teamService = {
  async list(query: TeamListQuery = {}): Promise<TeamPageResponse> {
    const response = await apiClient.get<TeamPageResponse>('/teams', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<TeamResponse> {
    const response = await apiClient.get<TeamResponse>(`/teams/${id}`)
    return response.data
  },

  async create(payload: CreateTeamRequest): Promise<TeamResponse> {
    const response = await apiClient.post<TeamResponse>('/teams', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async update(id: string, payload: UpdateTeamRequest): Promise<TeamResponse> {
    const response = await apiClient.patch<TeamResponse>(`/teams/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /** Désigne le chef parmi les membres. Exige une ré-authentification TOTP récente (step-up). */
  async assignLead(id: string, payload: AssignTeamLeadRequest): Promise<TeamResponse> {
    const response = await apiClient.put<TeamResponse>(`/teams/${id}/lead`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async addMembers(id: string, payload: TeamMembersRequest): Promise<TeamResponse> {
    const response = await apiClient.post<TeamResponse>(`/teams/${id}/members`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async removeMembers(id: string, payload: TeamMembersRequest): Promise<TeamResponse> {
    const response = await apiClient.post<TeamResponse>(`/teams/${id}/members/remove`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`, { headers: idempotencyHeaders() })
  },
}
