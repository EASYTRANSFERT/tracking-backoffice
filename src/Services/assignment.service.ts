import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  AssignmentBatchResponse,
  AssignmentImportReport,
  AssignmentListQuery,
  AssignmentPageResponse,
  AssignmentResponse,
  CreateAssignmentsRequest,
  UpdateAssignmentRequest,
} from '@/types/assignment'

export const assignmentService = {
  async list(query: AssignmentListQuery = {}): Promise<AssignmentPageResponse> {
    const response = await apiClient.get<AssignmentPageResponse>('/assignments', { params: query })
    return response.data
  },

  async findOne(id: string): Promise<AssignmentResponse> {
    const response = await apiClient.get<AssignmentResponse>(`/assignments/${id}`)
    return response.data
  },

  /** Tout ou rien : au premier conflit, aucun créneau n'est écrit. */
  async create(payload: CreateAssignmentsRequest): Promise<AssignmentBatchResponse> {
    const response = await apiClient.post<AssignmentBatchResponse>('/assignments', payload, { headers: idempotencyHeaders() })
    return response.data
  },

  /**
   * Planifie les créneaux d'un classeur (.xlsx ou .csv), une ligne par créneau. Tout ou rien.
   * dryRun : vérifie le fichier et renvoie le rapport sans rien écrire.
   */
  async importFile(file: File, dryRun: boolean): Promise<AssignmentImportReport> {
    const body = new FormData()
    body.append('file', file)
    const response = await apiClient.post<AssignmentImportReport>('/assignments/import', body, {
      params: dryRun ? { dryRun: true } : undefined,
      headers: dryRun ? undefined : idempotencyHeaders(),
    })
    return response.data
  },

  async update(id: string, payload: UpdateAssignmentRequest): Promise<AssignmentResponse> {
    const response = await apiClient.patch<AssignmentResponse>(`/assignments/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async cancel(id: string): Promise<AssignmentResponse> {
    const response = await apiClient.post<AssignmentResponse>(`/assignments/${id}/cancel`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },
}
