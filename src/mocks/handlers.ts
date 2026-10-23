import { http, HttpResponse, type DefaultBodyType } from 'msw'

import { mockEnterpriseUsers, mockMissions, mockSites, mockTeams } from '@/mocks/administrator-data'
import { mockAuthUsers, findMockAuthUserByCredentials, findMockAuthUserById } from '@/mocks/auth-users'
import { mockCompanies, mockOffers } from '@/mocks/operator-data'
import type { AccessTokenResponse, ConfirmTotpRequest, LoginChallengeResponse, LoginRequest, RefreshRequest, SessionResponse, TotpCodeRequest } from '@/types/auth'
import type { ApiProblemDetails } from '@/types/api'
import type { AssignTenantPlanRequest, CreateOfferRequest, CreateTenantRequest, OfferResponse, SuspendTenantRequest, TenantResponse, UpdateTenantRequest } from '@/types/platform'
import type { ApiMissionStatus, CreateMissionRequest, MissionResponse, UpdateMissionRequest } from '@/types/mission'
import type { CreateSiteRequest, SiteResponse, UpdateSiteRequest } from '@/types/site'
import type { AssignmentResponse, CreateAssignmentsRequest, UpdateAssignmentRequest } from '@/types/assignment'
import { addDays, startOfWeek, toDayKey } from '@/Components/sites/site-schedule'
import type { DeviceResponse, RevokeDeviceRequest } from '@/types/device'
import type { CreateTeamRequest, TeamMembersRequest, TeamResponse, UpdateTeamRequest } from '@/types/team'
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

const sites: SiteResponse[] = mockSites.map((site) => ({
  id: site.id,
  missionId: mockMissions.find((mission) => mission.siteId === site.id)?.id ?? mockMissions[0]!.id,
  name: site.name,
  address: site.address,
  // Petit triangle autour de la position du site fictif.
  area: [[0, 0], [0.0006, 0.0004], [0.0002, 0.0011]].map(([lat, lng]) => ({
    latitude: Number((Number(site.latitude ?? 7.6899) + lat!).toFixed(6)),
    longitude: Number((Number(site.longitude ?? -5.0301) + lng!).toFixed(6)),
  })),
  radiusM: site.radiusM ?? 100,
  managerId: site.managerId,
  // Une équipe par site fictif : Vridi pour l'équipe Nord, Yopougon pour l'équipe Sud.
  teamId: ({ 'site-1': 'team-1', 'site-2': 'team-2' } as Record<string, string>)[site.id],
  status: 'ACTIVE',
  createdAt: site.createdAt,
  updatedAt: site.createdAt,
}))
// QR factice (PNG 1×1) : le vrai visuel est produit par l'API.
const mockQrImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// Appareils fictifs : un par état pour couvrir l'affichage.
const devices: DeviceResponse[] = [
  { id: 'dev_mock_001', userId: 'user-4', publicKeyHash: 'a3f1c9e2', platform: 'android', model: 'Tecno Spark 10', osVersion: '14', appVersion: '1.0.0', status: 'ACTIVE', lastIntegrityVerdict: 'PLAY_STRONG', lastIntegrityAt: '2026-10-20T07:58:00.000Z', hasKeyAttestation: true, enrolledAt: '2026-09-13T08:10:00.000Z', lastSeenAt: '2026-10-20T08:02:00.000Z', revokedAt: null, revokedReason: null },
  { id: 'dev_mock_002', userId: 'user-3', publicKeyHash: '7be04d11', platform: 'android', model: 'Samsung Galaxy A15', osVersion: '14', appVersion: '1.0.0', status: 'ACTIVE', lastIntegrityVerdict: 'PLAY_DEVICE', lastIntegrityAt: '2026-10-19T17:40:00.000Z', hasKeyAttestation: true, enrolledAt: '2026-09-09T09:00:00.000Z', lastSeenAt: '2026-10-19T17:42:00.000Z', revokedAt: null, revokedReason: null },
  { id: 'dev_mock_003', userId: 'user-5', publicKeyHash: 'c51a8f30', platform: 'android', model: 'Infinix Hot 40', osVersion: '13', appVersion: '1.0.0', status: 'PENDING_ENROLLMENT', lastIntegrityVerdict: null, lastIntegrityAt: null, hasKeyAttestation: false, enrolledAt: null, lastSeenAt: null, revokedAt: null, revokedReason: null },
  { id: 'dev_mock_004', userId: 'user-7', publicKeyHash: '0d9e2b77', platform: 'ios', model: 'iPhone 12', osVersion: '17.6', appVersion: '1.0.0', status: 'ACTIVE', lastIntegrityVerdict: 'APP_ATTEST_OK', lastIntegrityAt: '2026-10-18T12:00:00.000Z', hasKeyAttestation: true, enrolledAt: '2026-09-11T10:00:00.000Z', lastSeenAt: '2026-10-18T12:05:00.000Z', revokedAt: null, revokedReason: null },
  { id: 'dev_mock_005', userId: 'user-6', publicKeyHash: 'e47b6a02', platform: 'android', model: 'Itel A70', osVersion: '13', appVersion: '0.9.4', status: 'REVOKED', lastIntegrityVerdict: 'PLAY_BASIC', lastIntegrityAt: '2026-10-05T08:00:00.000Z', hasKeyAttestation: false, enrolledAt: '2026-10-03T15:30:00.000Z', lastSeenAt: '2026-10-05T08:01:00.000Z', revokedAt: '2026-10-12T09:20:00.000Z', revokedReason: 'Téléphone déclaré perdu par l’agent le 12/10/2026.' },
  { id: 'dev_mock_006', userId: 'user-8', publicKeyHash: '9f3c1e58', platform: 'android', model: 'Tecno Camon 20', osVersion: '13', appVersion: '1.0.0', status: 'PENDING_ENROLLMENT', lastIntegrityVerdict: null, lastIntegrityAt: null, hasKeyAttestation: false, enrolledAt: null, lastSeenAt: null, revokedAt: null, revokedReason: null },
]

// Créneaux fictifs sur la semaine en cours, dont un poste de nuit.
const mockWeek = startOfWeek()
function mockAssignment(index: number, userId: string, siteId: string, dayOffset: number, start: string, end: string): AssignmentResponse {
  const day = addDays(mockWeek, dayOffset)
  const startAt = new Date(`${day}T${start}:00`)
  const endAt = new Date(`${day}T${end}:00`)
  if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1)
  return {
    id: `asg_mock_${index}`, userId, siteId, startAt: startAt.toISOString(), endAt: endAt.toISOString(), day,
    durationMin: (endAt.getTime() - startAt.getTime()) / 60_000, status: 'PLANNED',
    createdAt: '2026-10-15T08:00:00.000Z', updatedAt: '2026-10-15T08:00:00.000Z',
  }
}
const assignments: AssignmentResponse[] = [
  ...[0, 1, 2, 3, 4].map((day) => ['user-4', 'site-1', day, '07:00', '15:00'] as const),
  ...[0, 2, 4].map((day) => ['user-3', 'site-1', day, '15:00', '23:00'] as const),
  ...[1, 3].map((day) => ['user-7', 'site-2', day, '22:00', '06:00'] as const),
].map(([userId, siteId, day, start, end], index) => mockAssignment(index + 1, userId, siteId, day, start, end))

function assignmentProblem(status: number, code: string, detail: string, location: { userId?: string; slotIndex?: number } = {}) {
  return HttpResponse.json({ title: code, status, detail, code, ...location }, { status, headers: { 'Content-Type': 'application/problem+json' } })
}

const overlaps = (a: { startAt: string; endAt: string }, b: { startAt: string; endAt: string }) =>
  new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt)

// Mêmes contrôles que l'API : site actif avec une équipe, agents actifs de cette équipe, aucun chevauchement tous sites confondus.
function checkSiteForPlanning(siteId: string) {
  const site = sites.find((item) => item.id === siteId)
  if (!site) return problem(404, 'NOT_FOUND', 'Site introuvable.')
  if (site.status === 'ARCHIVED') return problem(409, 'SITE_ARCHIVED', 'Ce site est archivé.')
  if (!site.teamId) return problem(409, 'ASSIGNMENT_SITE_WITHOUT_TEAM', 'Ce site n’a pas d’équipe.')
  return site
}

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
  http.get(api('/sites'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const filtered = sites.filter((site) => (['status', 'missionId', 'teamId', 'managerId'] as const)
      .every((key) => !params.get(key) || site[key] === params.get(key)))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/sites/:id'), ({ params }) => {
    const site = sites.find((item) => item.id === String(params.id))
    return site ? HttpResponse.json(site) : problem(404, 'NOT_FOUND', 'Site introuvable ou hors périmètre.')
  }),
  http.post(api('/sites'), async ({ request }) => {
    const payload = (await request.json()) as CreateSiteRequest
    if (!payload.area || payload.area.length < 3) return problem(400, 'VALIDATION_FAILED', 'Le contour du site doit compter au moins 3 points.')
    if (!payload.address && !payload.locationDescription) return problem(400, 'VALIDATION_FAILED', 'Renseignez l’adresse ou la description de l’emplacement.')
    const timestamp = now()
    const site: SiteResponse = {
      id: `sit_${Date.now()}`, missionId: payload.missionId, teamId: payload.teamId, name: payload.name,
      address: payload.address, locationDescription: payload.locationDescription, area: payload.area,
      radiusM: payload.toleranceRadius ?? 100, managerId: payload.responsibleId, status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp,
    }
    sites.unshift(site)
    return HttpResponse.json(site, { status: 201 })
  }),
  http.patch(api('/sites/:id'), async ({ params, request }) => {
    const site = sites.find((item) => item.id === String(params.id))
    if (!site) return problem(404, 'NOT_FOUND', 'Site introuvable.')
    if (site.status === 'ARCHIVED') return problem(409, 'SITE_ARCHIVED', 'Ce site est archivé.')
    const { responsibleId, toleranceRadius, ...payload } = (await request.json()) as UpdateSiteRequest
    if (payload.missionId && site.missionId && payload.missionId !== site.missionId) return problem(409, 'CONFLICT', 'Ce site est déjà rattaché à une mission.')
    Object.assign(site, payload, { updatedAt: now() })
    if (responsibleId) site.managerId = responsibleId
    if (toleranceRadius) site.radiusM = toleranceRadius
    return HttpResponse.json(site)
  }),
  http.post(api('/sites/:id/archive'), ({ params }) => {
    const site = sites.find((item) => item.id === String(params.id))
    if (!site) return problem(404, 'NOT_FOUND', 'Site introuvable.')
    Object.assign(site, { status: 'ARCHIVED', updatedAt: now() })
    return HttpResponse.json(site)
  }),
  http.post(api('/sites/:id/qr-code'), ({ params }) => {
    const site = sites.find((item) => item.id === String(params.id))
    if (!site) return problem(404, 'NOT_FOUND', 'Site introuvable ou hors périmètre.')
    if (site.status === 'ARCHIVED') return problem(409, 'SITE_ARCHIVED', 'Ce site est archivé.')
    site.qrRotatedAt = now()
    return HttpResponse.json({ siteId: site.id, qrCode: mockQrImage, rotatedAt: site.qrRotatedAt })
  }),
  http.get(api('/devices'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const filtered = devices.filter((device) => (['userId', 'status'] as const)
      .every((key) => !params.get(key) || device[key] === params.get(key)))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/devices/:id'), ({ params }) => {
    const device = devices.find((item) => item.id === String(params.id))
    return device ? HttpResponse.json(device) : problem(404, 'NOT_FOUND', 'Appareil introuvable.')
  }),
  http.post(api('/devices/:id/revoke'), async ({ params, request }) => {
    // Le jeton « élevé » n'est délivré que par /auth/step-up.
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock-elevated-token')) {
      return problem(401, 'STEP_UP_REQUIRED', 'Une ré-authentification TOTP récente est requise.')
    }
    const device = devices.find((item) => item.id === String(params.id))
    if (!device) return problem(404, 'NOT_FOUND', 'Appareil introuvable.')
    const { reason } = (await request.json()) as RevokeDeviceRequest
    if (!reason?.trim()) return problem(400, 'VALIDATION_FAILED', 'Le motif de révocation est obligatoire.')
    // Idempotent : une seconde révocation ne déplace pas l'horodatage.
    if (device.status !== 'REVOKED') Object.assign(device, { status: 'REVOKED', revokedAt: now(), revokedReason: reason.trim() })
    return HttpResponse.json(device)
  }),

  http.get(api('/assignments'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const from = params.get('from')
    const to = params.get('to')
    const filtered = assignments
      .filter((item) => (['userId', 'siteId', 'status', 'day'] as const).every((key) => !params.get(key) || item[key] === params.get(key)))
      .filter((item) => (!from || item.startAt >= from) && (!to || item.startAt < to))
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/assignments/:id'), ({ params }) => {
    const assignment = assignments.find((item) => item.id === String(params.id))
    return assignment ? HttpResponse.json(assignment) : problem(404, 'NOT_FOUND', 'Créneau introuvable.')
  }),
  http.post(api('/assignments'), async ({ request }) => {
    const payload = (await request.json()) as CreateAssignmentsRequest
    const site = checkSiteForPlanning(payload.siteId)
    if (site instanceof Response) return site
    const userIds = [...new Set(payload.userIds)]
    if (!userIds.length || !payload.slots?.length) return problem(400, 'VALIDATION_FAILED', 'Choisissez au moins un agent et une vacation.')
    for (const [slotIndex, slot] of payload.slots.entries()) {
      const minutes = (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000
      if (!(minutes >= 30 && minutes <= 24 * 60)) return assignmentProblem(400, 'VALIDATION_FAILED', 'Une vacation doit durer entre 30 minutes et 24 heures.', { slotIndex })
    }
    const created: AssignmentResponse[] = []
    for (const userId of userIds) {
      const user = users.find((item) => item.id === userId)
      if (!user || user.status !== 'ACTIVE' || !user.roles.some((role) => ['AGENT', 'TEAM_LEAD'].includes(role))) {
        return assignmentProblem(409, 'ASSIGNMENT_AGENT_INVALID', 'Ce compte n’est pas un agent actif.', { userId })
      }
      if (user.teamId !== site.teamId) return assignmentProblem(409, 'ASSIGNMENT_AGENT_NOT_IN_SITE_TEAM', 'Cet agent n’appartient pas à l’équipe du site.', { userId })
      for (const [slotIndex, slot] of payload.slots.entries()) {
        const busy = [...assignments, ...created].some((item) => item.userId === userId && item.status === 'PLANNED' && overlaps(item, slot))
        if (busy) return assignmentProblem(409, 'ASSIGNMENT_OVERLAP', 'Cet agent a déjà un créneau sur cette plage.', { userId, slotIndex })
        const timestamp = now()
        created.push({
          id: `asg_${Date.now()}_${created.length}`, userId, siteId: site.id, startAt: slot.startAt, endAt: slot.endAt,
          day: toDayKey(new Date(slot.startAt)), durationMin: (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000,
          status: 'PLANNED', createdAt: timestamp, updatedAt: timestamp,
        })
      }
    }
    // Tout ou rien : rien n'est écrit avant que tout soit vérifié.
    assignments.push(...created)
    return HttpResponse.json({ count: created.length, items: created }, { status: 201 })
  }),
  http.patch(api('/assignments/:id'), async ({ params, request }) => {
    const assignment = assignments.find((item) => item.id === String(params.id))
    if (!assignment) return problem(404, 'NOT_FOUND', 'Créneau introuvable.')
    if (assignment.status === 'CANCELLED') return problem(409, 'ASSIGNMENT_CANCELLED', 'Ce créneau est annulé.')
    const payload = (await request.json()) as UpdateAssignmentRequest
    const next = { ...assignment, ...payload }
    const site = checkSiteForPlanning(next.siteId)
    if (site instanceof Response) return site
    if (users.find((item) => item.id === next.userId)?.teamId !== site.teamId) {
      return assignmentProblem(409, 'ASSIGNMENT_AGENT_NOT_IN_SITE_TEAM', 'Cet agent n’appartient pas à l’équipe du site.', { userId: next.userId })
    }
    if (assignments.some((item) => item.id !== assignment.id && item.userId === next.userId && item.status === 'PLANNED' && overlaps(item, next))) {
      return assignmentProblem(409, 'ASSIGNMENT_OVERLAP', 'Cet agent a déjà un créneau sur cette plage.', { userId: next.userId })
    }
    Object.assign(assignment, next, {
      day: toDayKey(new Date(next.startAt)),
      durationMin: (new Date(next.endAt).getTime() - new Date(next.startAt).getTime()) / 60_000,
      updatedAt: now(),
    })
    return HttpResponse.json(assignment)
  }),
  http.post(api('/assignments/:id/cancel'), ({ params }) => {
    const assignment = assignments.find((item) => item.id === String(params.id))
    if (!assignment) return problem(404, 'NOT_FOUND', 'Créneau introuvable.')
    // Idempotent : le créneau reste, il ne réserve simplement plus l'agent.
    if (assignment.status !== 'CANCELLED') Object.assign(assignment, { status: 'CANCELLED', updatedAt: now() })
    return HttpResponse.json(assignment)
  }),

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
    const lead = users.find((user) => user.id === payload.leadUserId && user.status === 'ACTIVE' && user.roles.includes('TEAM_LEAD'))
    if (!lead) return problem(409, 'TEAM_LEAD_INVALID', 'Le chef d’équipe doit être un compte actif portant le rôle TEAM_LEAD.')
    const team: TeamResponse = { id: `team-${Date.now()}`, name: payload.name, leadUserId: lead.id, createdAt: timestamp, updatedAt: timestamp }
    lead.teamId = team.id
    teams.unshift(team)
    return HttpResponse.json(team, { status: 201 })
  }),
  http.patch(api('/teams/:id'), async ({ params, request }) => {
    const team = teams.find((item) => item.id === String(params.id))
    if (!team) return problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
    const payload = (await request.json()) as UpdateTeamRequest
    if (payload.name) team.name = payload.name
    team.updatedAt = now()
    return HttpResponse.json(team)
  }),
  http.post(api('/teams/:id/members'), async ({ params, request }) => {
    const team = teams.find((item) => item.id === String(params.id))
    if (!team) return problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
    const { userIds } = (await request.json()) as TeamMembersRequest
    const selected = users.filter((user) => userIds.includes(user.id))
    const invalid = selected.find((user) => !user.roles.includes('AGENT'))
    if (invalid) return problem(409, 'TEAM_MEMBER_NOT_AGENT', `${invalid.names} n’est pas un agent.`)
    const assigned = selected.find((user) => user.teamId && user.teamId !== team.id)
    if (assigned) return problem(409, 'USER_ALREADY_IN_TEAM', `${assigned.names} appartient déjà à une équipe.`)
    selected.forEach((user) => { user.teamId = team.id; user.updatedAt = now() })
    team.updatedAt = now()
    return HttpResponse.json(team)
  }),
  http.post(api('/teams/:id/members/remove'), async ({ params, request }) => {
    const team = teams.find((item) => item.id === String(params.id))
    if (!team) return problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
    const { userIds } = (await request.json()) as TeamMembersRequest
    if (team.leadUserId && userIds.includes(team.leadUserId)) {
      return problem(409, 'TEAM_LEAD_REQUIRED', "Le chef d’équipe doit d’abord être remplacé.")
    }
    const selected = users.filter((user) => userIds.includes(user.id))
    const absent = selected.find((user) => user.teamId !== team.id)
    if (absent) return problem(409, 'USER_NOT_IN_TEAM', `${absent.names} n’appartient pas à cette équipe.`)
    selected.forEach((user) => { user.teamId = undefined; user.updatedAt = now() })
    team.updatedAt = now()
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
