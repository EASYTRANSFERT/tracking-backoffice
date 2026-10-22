import { apiClient } from './api-client'
import { idempotencyHeaders } from './request-headers'

import type {
  AttendanceSessionDecisionRequest,
  AttendanceSessionListQuery,
  AttendanceSessionPageResponse,
  AttendanceSessionResponse,
} from '@/types/attendance-session'

export const attendanceSessionService = {
  async list(query: AttendanceSessionListQuery = {}): Promise<AttendanceSessionPageResponse> {
    const response = await apiClient.get<AttendanceSessionPageResponse>('/sessions', { params: query })
    return response.data
  },

  async decide(id: string, payload: AttendanceSessionDecisionRequest): Promise<AttendanceSessionResponse> {
    const response = await apiClient.post<AttendanceSessionResponse>(`/sessions/${id}/decision`, payload, { headers: idempotencyHeaders() })
    return response.data
  },
}
