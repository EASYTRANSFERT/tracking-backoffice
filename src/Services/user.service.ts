import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  CreateUserRequest,
  MatriculeImportReport,
  UpdatePasswordRequest,
  UpdateUserRolesRequest,
  UpdateUserRequest,
  UserListQuery,
  UserPageResponse,
  UserResponse,
} from '@/types/user'

/** Corps multipart de POST /users : les champs texte habituels plus la photo (axios pose lui-même le Content-Type). */
function toFormData(payload: CreateUserRequest, photo: File): FormData {
  const body = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== '') body.append(key, String(value))
  }
  body.append('photo', photo)
  return body
}

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

  /** Avec une photo (agent, chef d'équipe), la requête part en multipart ; sinon en JSON. `role` doit alors être une seule valeur. */
  async create(payload: CreateUserRequest, photo?: File): Promise<UserResponse> {
    const body = photo ? toFormData(payload, photo) : payload
    const response = await apiClient.post<UserResponse>('/users', body, { headers: idempotencyHeaders() })
    return response.data
  },

  /** Ajoute ou remplace la photo de profil d'un compte (admin et opérateur seulement). */
  async replaceProfilePhoto(userId: string, photo: File): Promise<UserResponse> {
    const body = new FormData()
    body.append('photo', photo)
    const response = await apiClient.put<UserResponse>(`/users/${userId}/profile-photo`, body, { headers: idempotencyHeaders() })
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

  /** Change les rôles seulement (opération sensible : step-up TOTP récent exigé). */
  async updateRoles(userId: string, payload: UpdateUserRolesRequest): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>(`/users/${userId}/roles`, payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
