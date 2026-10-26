import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateUserRequest,
  MatriculeImportReport,
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

  /**
   * Remplace les matricules à partir d'un classeur (.xlsx ou .csv : nom, téléphone, matricule).
   * dryRun : vérifie le fichier et renvoie le rapport sans rien écrire.
   */
  async importMatricules(file: File, dryRun: boolean): Promise<MatriculeImportReport> {
    const body = new FormData()
    body.append('file', file)
    const response = await apiClient.post<MatriculeImportReport>('/users/matricules/import', body, {
      params: dryRun ? { dryRun: true } : undefined,
      headers: dryRun ? undefined : idempotencyHeaders(),
    })
    return response.data
  },

  async updatePassword(userId: string, payload: UpdatePasswordRequest): Promise<void> {
    await apiClient.patch(`/users/${userId}/password`, payload, { headers: idempotencyHeaders() })
  },
}
