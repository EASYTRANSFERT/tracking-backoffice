import { apiClient } from './api-client'

import type { AuditLogListQuery, AuditLogPageResponse } from '@/types/audit'

export const auditService = {
  /** Les plus récentes d'abord. La consultation elle-même n'est pas journalisée. */
  async list(query: AuditLogListQuery = {}): Promise<AuditLogPageResponse> {
    const response = await apiClient.get<AuditLogPageResponse>('/audit-logs', { params: query })
    return response.data
  },
}
