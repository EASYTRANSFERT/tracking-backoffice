import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  AssignmentBatchResponse,
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

  async update(id: string, payload: UpdateAssignmentRequest): Promise<AssignmentResponse> {
    const response = await apiClient.patch<AssignmentResponse>(`/assignments/${id}`, payload, { headers: idempotencyHeaders() })
    return response.data
  },

  async cancel(id: string): Promise<AssignmentResponse> {
    const response = await apiClient.post<AssignmentResponse>(`/assignments/${id}/cancel`, undefined, { headers: idempotencyHeaders() })
    return response.data
  },
}
