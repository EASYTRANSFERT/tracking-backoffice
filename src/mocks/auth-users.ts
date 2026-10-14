import type { UserResponse } from '@/types/user'

export interface MockAuthUser {
  password: string
  totpCode: string
  firstTotpSetup: boolean
  user: UserResponse
}

export const mockAuthUsers: MockAuthUser[] = [
  {
    password: 'Password123!',
    totpCode: '123456',
    firstTotpSetup: false,
    user: {
      id: 'usr_0192f1c47d3a7b219e553f0a2c8d4e10',
      matricule: 'KBA-OP-001',
      names: 'Martial Djezou',
      email: 'operateur@kaybic.africa',
      phone: '+2250700000001',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  },
  {
    password: 'Password123!',
    totpCode: '123456',
    firstTotpSetup: false,
    user: {
      id: 'user-1',
      matricule: 'ENT-ADM-001',
      names: 'Aïcha Koné',
      email: 'admin@entreprise.test',
      phone: '+2250700000002',
      roles: ['ADMIN'],
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  },
  {
    password: 'Password123!',
    totpCode: '123456',
    firstTotpSetup: false,
    user: {
      id: 'user-2',
      matricule: 'ENT-SUP-001',
      names: 'Yann Kouassi',
      email: 'superviseur@entreprise.test',
      phone: '+2250700000003',
      roles: ['SUPERVISOR'],
      teamId: 'team_0192f1c47d3a7b219e553f0a2c8d4e10',
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  },
  {
    password: 'Password123!',
    totpCode: '123456',
    firstTotpSetup: true,
    user: {
      id: 'user-3',
      matricule: 'ENT-LEAD-001',
      names: 'Fatou Bamba',
      email: 'chef.equipe@entreprise.test',
      phone: '+2250700000004',
      roles: ['TEAM_LEAD'],
      teamId: 'team-1',
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  },
]

export function findMockAuthUserByCredentials(
  email: string,
  password: string,
) {
  return mockAuthUsers.find(
    (entry) =>
      entry.user.email?.toLowerCase() === email.toLowerCase() &&
      entry.password === password,
  )
}

export function findMockAuthUserById(userId: string) {
  return mockAuthUsers.find((entry) => entry.user.id === userId)
}
