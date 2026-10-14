import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  AssignTenantPlanRequest,
  CreateTenantRequest,
  CursorPage,
  CursorQuery,
  SuspendTenantRequest,
  TenantResponse,
  UpdateTenantRequest,
} from '@/types/platform'
import type { CreateTenantUserRequest, UserResponse } from '@/types/user'

export const tenantService = {
  async list(query: CursorQuery = {}): Promise<CursorPage<TenantResponse>> {
    const response = await apiClient.get<CursorPage<TenantResponse>>('/platform/tenants', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<TenantResponse> {
    const response = await apiClient.get<TenantResponse>(`/platform/tenants/${id}`)
    return response.data
  },

  async create(payload: CreateTenantRequest): Promise<TenantResponse> {
    const response = await apiClient.post<TenantResponse>('/platform/tenants', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async update(id: string, payload: UpdateTenantRequest): Promise<TenantResponse> {
    const response = await apiClient.patch<TenantResponse>(`/platform/tenants/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async activate(id: string): Promise<TenantResponse> {
    const response = await apiClient.post<TenantResponse>(`/platform/tenants/${id}/activate`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },

  async suspend(id: string, payload: SuspendTenantRequest): Promise<TenantResponse> {
    const response = await apiClient.post<TenantResponse>(`/platform/tenants/${id}/suspend`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async assignPlan(id: string, payload: AssignTenantPlanRequest): Promise<TenantResponse> {
    const response = await apiClient.put<TenantResponse>(`/platform/tenants/${id}/plan`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async createUser(id: string, payload: CreateTenantUserRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>(
      `/platform/tenants/${id}/users`,
      payload,
      { headers: idempotencyHeaders() },
    )

    return response.data
  },
}
