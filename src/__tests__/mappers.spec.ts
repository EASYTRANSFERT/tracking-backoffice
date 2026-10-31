import { describe, expect, it } from 'vitest'

import { mapUser, roleFieldToApi, rolesToApi } from '@/stores/mappers'
import type { ApiUserRole, UserResponse } from '@/types/user'

const user = (roles: ApiUserRole[]): UserResponse => ({
  id: 'usr_1', matricule: 'AG-1', names: 'Awa Koffi', phone: '+2250700000000', roles, status: 'ACTIVE',
  createdAt: '2026-10-29T08:00:00.000Z', updatedAt: '2026-10-29T08:00:00.000Z',
})

describe('mapUser', () => {
  it('shows a team leader as such, whatever the order of its roles', () => {
    expect(mapUser(user(['AGENT', 'TEAM_LEAD'])).role).toBe('teamLeader')
    expect(mapUser(user(['TEAM_LEAD', 'AGENT'])).role).toBe('teamLeader')
  })

  it('keeps a plain agent as an agent', () => {
    expect(mapUser(user(['AGENT'])).role).toBe('agent')
  })

  it('falls back to agent when no known role is returned', () => {
    expect(mapUser(user([])).role).toBe('agent')
  })
})

describe('rolesToApi', () => {
  it('sends AGENT and TEAM_LEAD together for a team leader', () => {
    expect(rolesToApi('teamLeader')).toEqual(['AGENT', 'TEAM_LEAD'])
  })

  it('sends a single role for the others', () => {
    expect(rolesToApi('agent')).toEqual(['AGENT'])
    expect(rolesToApi('supervisor')).toEqual(['SUPERVISOR'])
  })
})

describe('roleFieldToApi', () => {
  it('sends a list with AGENT and TEAM_LEAD for a team leader, a single role otherwise', () => {
    expect(roleFieldToApi('teamLeader')).toEqual(['AGENT', 'TEAM_LEAD'])
    expect(roleFieldToApi('agent')).toBe('AGENT')
  })
})
