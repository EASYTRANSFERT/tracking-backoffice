import type { CursorPage, CursorQuery } from './platform'

export interface TeamResponse {
  id: string
  name: string
  leadUserId?: string | null
  supervisorUserId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTeamRequest {
  name: string
  supervisorUserId: string
}

export interface UpdateTeamRequest {
  name?: string
}

export interface AssignSupervisorRequest {
  userId: string
}

export interface TeamMembersRequest {
  userIds: string[]
}

export type TeamPageResponse = CursorPage<TeamResponse>
export type TeamListQuery = CursorQuery
