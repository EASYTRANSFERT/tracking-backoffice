import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateUserRequest,
  UpdatePasswordRequest,
  UpdateUserRequest,
  UserListQuery,
  UserPageResponse,
  UserResponse,
} from '@/types/user'

export const userService = {
  async list(query: UserListQuery = {}): Promise<UserPageResponse> {
    const response = await apiClient.get<UserPageResponse>('/users', { params: query })
    return response.data
  },

  async findOne(userId: string): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(
      `/users/${userId}`,
    )

    return response.data
  },

  async create(payload: CreateUserRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/users', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async update(userId: string, payload: UpdateUserRequest): Promise<UserResponse> {
    const response = await apiClient.patch<UserResponse>(`/users/${userId}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async disable(userId: string): Promise<UserResponse> {
    const response = await apiClient.delete<UserResponse>(`/users/${userId}`, { headers: idempotencyHeaders() })
    return response.data
  },

  async updatePassword(userId: string, payload: UpdatePasswordRequest): Promise<void> {
    await apiClient.patch(`/users/${userId}/password`, payload, { headers: idempotencyHeaders() })
  },
}
