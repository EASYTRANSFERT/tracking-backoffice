import { http, HttpResponse, type DefaultBodyType } from 'msw'

import { mockEnterpriseUsers, mockMissions, mockTeams } from '@/mocks/administrator-data'
import { mockAuthUsers, findMockAuthUserByCredentials, findMockAuthUserById } from '@/mocks/auth-users'
import { mockCompanies, mockOffers } from '@/mocks/operator-data'
import type { AccessTokenResponse, ConfirmTotpRequest, LoginChallengeResponse, LoginRequest, RefreshRequest, SessionResponse, TotpCodeRequest } from '@/types/auth'
import type { ApiProblemDetails } from '@/types/api'
import type { AssignTenantPlanRequest, CreateOfferRequest, CreateTenantRequest, OfferResponse, SuspendTenantRequest, TenantResponse, UpdateTenantRequest } from '@/types/platform'
import type { ApiMissionStatus, CreateMissionRequest, MissionResponse, UpdateMissionRequest } from '@/types/mission'
import type { CreateTeamRequest, TeamResponse, UpdateTeamRequest } from '@/types/team'
import type { CreateTenantUserRequest, CreateUserRequest, UpdatePasswordRequest, UpdateUserRequest, UserResponse } from '@/types/user'

const mockQrCode = '/qrcode.png'
const now = () => new Date().toISOString()
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  'https://exercise-classical-travelers-luck.trycloudflare.com/api/v1'
).replace(/\/$/, '')
const api = (path: string) => `${apiBaseUrl}${path}`

const offers: OfferResponse[] = mockOffers.map((offer) => ({
  id: offer.id, code: offer.code, name: offer.name, description: offer.description,
  maxAgents: offer.maxActiveAgents, status: offer.status === 'active' ? 'ACTIVE' : 'INACTIVE',
  createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z',
}))

const tenants: TenantResponse[] = mockCompanies.map((company) => {
  const offer = offers.find((item) => item.id === company.offerId)
  return {
    id: company.id, name: company.legalName, country: company.country, timezone: company.timezone,
    status: company.status === 'active' ? 'ACTIVE' : company.status === 'suspended' ? 'SUSPENDED' : 'PENDING',
    plan: offer ? { offerId: offer.id, code: offer.code, name: offer.name, maxAgents: offer.maxAgents, assignedAt: company.createdAt } : null,
    contractFrom: company.contractFrom ?? company.createdAt, contractTo: company.contractTo ?? null,
    activatedAt: company.status === 'active' ? company.createdAt : null,
    suspendedAt: company.status === 'suspended' ? company.createdAt : null,
    suspensionReason: company.suspensionReason ?? null,
    settings: { radiusM: 100, lateToleranceMin: 15, maxAccuracyM: 50, missingExitAfterMin: 60, checksPerSession: 3, retention: { selfieDays: 30, dataYears: 5, anonymizeAfterYears: 5, exportDays: 7 } },
    createdAt: company.createdAt, updatedAt: company.createdAt,
  }
})

let teams: TeamResponse[] = mockTeams.map((team) => ({ ...team, leadUserId: team.leadUserId ?? null }))
const missionStatusToApi: Record<(typeof mockMissions)[number]['status'], ApiMissionStatus> = {
  scheduled: 'PLANNED', ongoing: 'OPEN', completed: 'CLOSED', cancelled: 'CLOSED',
}
const missions: MissionResponse[] = mockMissions.map((mission) => ({
  id: mission.id,
  code: mission.code,
  name: mission.title,
  description: mission.notes,
  startAt: mission.startAt ? new Date(mission.startAt).toISOString() : undefined,
  endAt: mission.endAt ? new Date(mission.endAt).toISOString() : undefined,
  status: missionStatusToApi[mission.status],
  openedAt: mission.status === 'ongoing' ? new Date(mission.startAt!).toISOString() : undefined,
  closedAt: ['completed', 'cancelled'].includes(mission.status) ? new Date(mission.endAt!).toISOString() : undefined,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
}))
const users: UserResponse[] = [
  ...mockAuthUsers
    .filter((entry) => entry.user.roles.includes('OPERATOR'))
    .map((entry) => structuredClone(entry.user)),
  ...mockEnterpriseUsers.map((user) => ({
    id: user.id, matricule: user.employeeNumber, names: `${user.firstName} ${user.lastName}`,
    email: user.email, phone: user.phone,
    roles: [user.role === 'administrator' ? 'ADMIN' : user.role === 'supervisor' ? 'SUPERVISOR' : user.role === 'teamLeader' ? 'TEAM_LEAD' : 'AGENT'],
    teamId: user.teamId,
    status: user.status === 'active' ? 'ACTIVE' : user.status === 'disabled' ? 'DISABLED' : 'PENDING_ACTIVATION',
    createdAt: user.createdAt, updatedAt: user.createdAt,
  } satisfies UserResponse)),
]

function problem(status: number, code: string, detail: string): HttpResponse<DefaultBodyType> {
  const body: ApiProblemDetails = { title: code, status, detail, code }
  return HttpResponse.json(body, { status, headers: { 'Content-Type': 'application/problem+json' } })
}

function page<T>(request: Request, items: T[]) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 200)
  const start = Math.max(Number(url.searchParams.get('cursor') ?? 0), 0)
  const result = items.slice(start, start + limit)
  const next = start + limit
  return { items: result, nextCursor: next < items.length ? String(next) : null }
}

export const handlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    const credentials = (await request.json()) as LoginRequest
    const mockUser = findMockAuthUserByCredentials(credentials.email, credentials.password)
    if (!mockUser) return problem(401, 'INVALID_CREDENTIALS', 'Adresse e-mail ou mot de passe incorrect.')
    const response: LoginChallengeResponse = { userId: mockUser.user.id, ...(mockUser.firstTotpSetup ? { qrCode: mockQrCode } : {}) }
    return HttpResponse.json(response)
  }),
  http.post(api('/auth/totp/confirm'), async ({ request }) => {
    const payload = (await request.json()) as ConfirmTotpRequest
    const mockUser = findMockAuthUserById(payload.userId)
    if (!mockUser || payload.code !== mockUser.totpCode) return problem(401, 'TOTP_INVALID', 'Le code de vérification est incorrect.')
    return HttpResponse.json<SessionResponse>({ accessToken: `mock-access-token-${payload.userId}`, refreshToken: `mock-refresh-token-${payload.userId}`, tokenType: 'Bearer', expiresIn: 900 })
  }),
  http.post(api('/auth/refresh'), async ({ request }) => {
    const payload = (await request.json()) as RefreshRequest
    if (!payload.refreshToken.startsWith('mock-refresh-token')) return problem(401, 'REFRESH_TOKEN_INVALID', 'Le jeton de renouvellement est invalide.')
    return HttpResponse.json<SessionResponse>({ accessToken: `mock-access-token-${Date.now()}`, refreshToken: `mock-refresh-token-${Date.now()}`, tokenType: 'Bearer', expiresIn: 900 })
  }),
  http.post(api('/auth/logout'), () => new HttpResponse(null, { status: 204 })),
  http.post(api('/auth/step-up'), async ({ request }) => {
    const payload = (await request.json()) as TotpCodeRequest
    if (payload.code !== '123456') return problem(401, 'TOTP_INVALID', 'Le code de vérification est incorrect.')
    return HttpResponse.json<AccessTokenResponse>({ accessToken: `mock-elevated-token-${Date.now()}`, tokenType: 'Bearer', expiresIn: 300 })
  }),

  http.get(api('/platform/tenants'), ({ request }) => HttpResponse.json(page(request, tenants))),
  http.get(api('/platform/tenants/:id'), ({ params }) => {
    const item = tenants.find((tenant) => tenant.id === String(params.id))
    return item ? HttpResponse.json(item) : problem(404, 'NOT_FOUND', "L’entreprise demandée n’existe pas.")
  }),
  http.post(api('/platform/tenants'), async ({ request }) => {
    const payload = (await request.json()) as CreateTenantRequest
    const offer = offers.find((item) => item.id === payload.offerId)
    const timestamp = now()
    const tenant: TenantResponse = {
      id: `tenant-${Date.now()}`, name: payload.name, country: payload.country,
      timezone: payload.timezone ?? 'Africa/Abidjan', status: 'PENDING',
      plan: offer ? { offerId: offer.id, code: offer.code, name: offer.name, maxAgents: offer.maxAgents, assignedAt: timestamp } : null,
      contractFrom: payload.contractFrom, contractTo: payload.contractTo ?? null,
      activatedAt: null, suspendedAt: null, suspensionReason: null,
      settings: payload.settings ?? { radiusM: 100, lateToleranceMin: 15, maxAccuracyM: 50, missingExitAfterMin: 60, checksPerSession: 3, retention: { selfieDays: 30, dataYears: 5, anonymizeAfterYears: 5, exportDays: 7 } },
      createdAt: timestamp, updatedAt: timestamp,
    }
    tenants.unshift(tenant)
    return HttpResponse.json(tenant, { status: 201 })
  }),
  http.patch(api('/platform/tenants/:id'), async ({ params, request }) => {
    const index = tenants.findIndex((item) => item.id === String(params.id))
    if (index < 0) return problem(404, 'NOT_FOUND', "L’entreprise demandée n’existe pas.")
    const payload = (await request.json()) as UpdateTenantRequest
    tenants[index] = { ...tenants[index]!, ...payload, updatedAt: now() }
    return HttpResponse.json(tenants[index])
  }),
  http.post(api('/platform/tenants/:id/activate'), ({ params }) => updateTenantStatus(String(params.id), 'ACTIVE')),
  http.post(api('/platform/tenants/:id/suspend'), async ({ params, request }) => {
    const payload = (await request.json()) as SuspendTenantRequest
    return updateTenantStatus(String(params.id), 'SUSPENDED', payload.reason)
  }),
  http.put(api('/platform/tenants/:id/plan'), async ({ params, request }) => {
    const tenant = tenants.find((item) => item.id === String(params.id))
    const payload = (await request.json()) as AssignTenantPlanRequest
    const offer = offers.find((item) => item.id === payload.offerId)
    if (!tenant || !offer) return problem(404, 'NOT_FOUND', "L’entreprise ou l’offre demandée n’existe pas.")
    tenant.plan = { offerId: offer.id, code: offer.code, name: offer.name, maxAgents: offer.maxAgents, assignedAt: now() }
    tenant.updatedAt = now()
    return HttpResponse.json(tenant)
  }),
  http.post(api('/platform/tenants/:id/users'), async ({ params, request }) => {
    const tenant = tenants.find((item) => item.id === String(params.id))
    if (!tenant) return problem(404, 'NOT_FOUND', "L’entreprise demandée n’existe pas.")
    const payload = (await request.json()) as CreateTenantUserRequest
    const timestamp = now()
    const user: UserResponse = {
      id: `user-${Date.now()}`,
      matricule: payload.matricule,
      names: payload.names,
      email: payload.email,
      phone: payload.phone,
      roles: [payload.role],
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    users.unshift(user)
    return HttpResponse.json(user, { status: 201 })
  }),
  http.get(api('/platform/offers'), ({ request }) => HttpResponse.json(page(request, offers))),
  http.post(api('/platform/offers'), async ({ request }) => {
    const payload = (await request.json()) as CreateOfferRequest
    const timestamp = now()
    const offer: OfferResponse = { id: `offer-${Date.now()}`, ...payload, status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }
    offers.unshift(offer)
    return HttpResponse.json(offer, { status: 201 })
  }),

  http.get(api('/users'), ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const role = url.searchParams.get('role')
    const teamId = url.searchParams.get('teamId')
    const filtered = users.filter((user) => (!status || user.status === status) && (!role || user.roles.includes(role as UserResponse['roles'][number])) && (!teamId || user.teamId === teamId))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/users/:userId'), ({ params }) => {
    const user = users.find((item) => item.id === String(params.userId))
    return user ? HttpResponse.json(user) : problem(404, 'NOT_FOUND', "L’utilisateur demandé n’existe pas.")
  }),
  http.post(api('/users'), async ({ request }) => {
    const payload = (await request.json()) as CreateUserRequest
    const timestamp = now()
    const user: UserResponse = { id: `user-${Date.now()}`, matricule: payload.matricule, names: payload.names, email: payload.email, phone: payload.phone, roles: [payload.role], teamId: payload.teamId, status: 'PENDING_ACTIVATION', createdAt: timestamp, updatedAt: timestamp }
    users.unshift(user)
    return HttpResponse.json(user, { status: 201 })
  }),
  http.patch(api('/users/:userId/password'), async ({ params, request }) => {
    const payload = (await request.json()) as UpdatePasswordRequest
    const entry = findMockAuthUserById(String(params.userId))
    if (!entry) return problem(404, 'NOT_FOUND', "L’utilisateur demandé n’existe pas.")
    if (entry.password !== payload.currentPassword) return problem(400, 'CURRENT_PASSWORD_INVALID', 'Le mot de passe actuel est incorrect.')
    entry.password = payload.newPassword
    return new HttpResponse(null, { status: 204 })
  }),
  http.patch(api('/users/:userId'), async ({ params, request }) => {
    const index = users.findIndex((item) => item.id === String(params.userId))
    if (index < 0) return problem(404, 'NOT_FOUND', "L’utilisateur demandé n’existe pas.")
    const payload = (await request.json()) as UpdateUserRequest
    users[index] = { ...users[index]!, matricule: payload.matricule, names: payload.names, email: payload.email, phone: payload.phone, roles: [payload.role], teamId: payload.teamId, updatedAt: now() }
    return HttpResponse.json(users[index])
  }),
  http.delete(api('/users/:userId'), ({ params }) => {
    const user = users.find((item) => item.id === String(params.userId))
    if (!user) return problem(404, 'NOT_FOUND', "L’utilisateur demandé n’existe pas.")
    user.status = 'DISABLED'; user.updatedAt = now()
    return HttpResponse.json(user)
  }),

  http.get(api('/missions'), ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const filtered = status ? missions.filter((mission) => mission.status === status) : missions
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/missions/:id'), ({ params }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    return mission ? HttpResponse.json(mission) : problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
  }),
  http.post(api('/missions'), async ({ request }) => {
    const payload = (await request.json()) as CreateMissionRequest
    const timestamp = now()
    const mission: MissionResponse = {
      id: `mission-${Date.now()}`,
      code: payload.code,
      name: payload.name,
      description: payload.description,
      startAt: payload.startAt,
      endAt: payload.endAt,
      status: 'PLANNED',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    missions.unshift(mission)
    return HttpResponse.json(mission, { status: 201 })
  }),
  http.patch(api('/missions/:id'), async ({ params, request }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    if (!mission) return problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
    const payload = (await request.json()) as UpdateMissionRequest
    Object.assign(mission, payload, { updatedAt: now() })
    return HttpResponse.json(mission)
  }),
  http.post(api('/missions/:id/open'), ({ params }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    if (!mission) return problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
    if (mission.status !== 'PLANNED') return problem(409, 'MISSION_STATUS_CONFLICT', 'Seule une mission planifiée peut être ouverte.')
    mission.status = 'OPEN'; mission.openedAt = now(); mission.updatedAt = now()
    return HttpResponse.json(mission)
  }),
  http.post(api('/missions/:id/close'), ({ params }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    if (!mission) return problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
    if (mission.status !== 'OPEN') return problem(409, 'MISSION_STATUS_CONFLICT', 'Seule une mission ouverte peut être clôturée.')
    mission.status = 'CLOSED'; mission.closedAt = now(); mission.updatedAt = now()
    return HttpResponse.json(mission)
  }),

  http.get(api('/teams'), ({ request }) => HttpResponse.json(page(request, teams))),
  http.get(api('/teams/:id'), ({ params }) => {
    const team = teams.find((item) => item.id === String(params.id))
    return team ? HttpResponse.json(team) : problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
  }),
  http.post(api('/teams'), async ({ request }) => {
    const payload = (await request.json()) as CreateTeamRequest
    const timestamp = now()
    const team: TeamResponse = { id: `team-${Date.now()}`, name: payload.name, leadUserId: null, createdAt: timestamp, updatedAt: timestamp }
    teams.unshift(team)
    return HttpResponse.json(team, { status: 201 })
  }),
  http.patch(api('/teams/:id'), async ({ params, request }) => {
    const team = teams.find((item) => item.id === String(params.id))
    if (!team) return problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
    const payload = (await request.json()) as UpdateTeamRequest
    team.name = payload.name; team.updatedAt = now()
    return HttpResponse.json(team)
  }),
  http.delete(api('/teams/:id'), ({ params }) => {
    const id = String(params.id)
    if (users.some((user) => user.teamId === id)) return problem(409, 'TEAM_NOT_EMPTY', "Cette équipe contient encore des utilisateurs.")
    teams = teams.filter((item) => item.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
]

function updateTenantStatus(id: string, status: TenantResponse['status'], reason?: string) {
  const tenant = tenants.find((item) => item.id === id)
  if (!tenant) return problem(404, 'NOT_FOUND', "L’entreprise demandée n’existe pas.")
  if (status === 'ACTIVE' && !tenant.plan) {
    return problem(409, 'TENANT_PLAN_REQUIRED', "Une offre doit être attribuée avant l’activation.")
  }
  if (status === 'SUSPENDED' && tenant.status !== 'ACTIVE') {
    return problem(409, 'TENANT_STATUS_CONFLICT', "Seule une entreprise active peut être suspendue.")
  }
  tenant.status = status
  tenant.activatedAt = status === 'ACTIVE' ? now() : tenant.activatedAt
  tenant.suspendedAt = status === 'SUSPENDED' ? now() : null
  tenant.suspensionReason = status === 'SUSPENDED' ? reason ?? null : null
  tenant.updatedAt = now()
  return HttpResponse.json(tenant)
}
