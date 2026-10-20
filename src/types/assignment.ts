export type ApiAssignmentStatus = 'PLANNED' | 'CANCELLED'

/** Vacation : prise et fin de poste, ISO 8601. La fin peut tomber le lendemain (poste de nuit). */
export interface AssignmentSlot {
  startAt: string
  endAt: string
}

export interface AssignmentResponse {
  id: string
  userId: string
  siteId: string
  startAt: string
  endAt: string
  /** Journée de la prise de poste, AAAA-MM-JJ dans le fuseau de l'entreprise. */
  day: string
  durationMin: number
  recurrenceId?: string
  status: ApiAssignmentStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAssignmentsRequest {
  siteId: string
  /** Membres actifs de l'équipe du site, 200 au maximum. */
  userIds: string[]
  /** 50 vacations au maximum, posées pour chacun des agents. */
  slots: AssignmentSlot[]
}

export interface UpdateAssignmentRequest {
  startAt?: string
  endAt?: string
  siteId?: string
}

export interface AssignmentListQuery {
  cursor?: string
  limit?: number
  userId?: string
  siteId?: string
  status?: ApiAssignmentStatus
  day?: string
  from?: string
  to?: string
}

export interface AssignmentPageResponse {
  items: AssignmentResponse[]
  nextCursor?: string | null
}

export interface AssignmentBatchResponse {
  count: number
  items: AssignmentResponse[]
}
