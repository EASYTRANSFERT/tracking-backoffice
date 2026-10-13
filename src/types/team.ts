import type { CursorPage, CursorQuery } from './platform'

export interface TeamResponse {
  id: string
  name: string
  leadUserId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTeamRequest {
  name: string
}

export interface UpdateTeamRequest {
  name: string
}

export type TeamPageResponse = CursorPage<TeamResponse>
export type TeamListQuery = CursorQuery
