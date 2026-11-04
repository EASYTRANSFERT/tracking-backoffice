import { http, HttpResponse, type DefaultBodyType } from 'msw'

import { mockEnterpriseUsers, mockMissions, mockSites, mockTeams } from '@/mocks/administrator-data'
import { mockAuthUsers, findMockAuthUserByCredentials, findMockAuthUserById } from '@/mocks/auth-users'
import { mockCompanies, mockOffers } from '@/mocks/operator-data'
import type { AccessTokenResponse, ConfirmTotpRequest, LoginChallengeResponse, LoginRequest, RefreshRequest, SessionResponse, SetupPasswordRequest, TotpCodeRequest } from '@/types/auth'
import type { ApiProblemDetails } from '@/types/api'
import type { AssignTenantPlanRequest, CreateOfferRequest, CreateTenantRequest, OfferResponse, SuspendTenantRequest, TenantResponse, UpdateTenantRequest } from '@/types/platform'
import type { ApiMissionStatus, AssignMissionSitesRequest, AssignMissionSupervisorRequest, CreateMissionRequest, MissionResponse, UpdateMissionRequest } from '@/types/mission'
import type { CreateSiteRequest, SiteResponse, UpdateSiteRequest } from '@/types/site'
import type { AssignmentImportRejection, AssignmentResponse, CreateAssignmentsRequest, UpdateAssignmentRequest } from '@/types/assignment'
import { addDays, startOfWeek, toDayKey } from '@/Components/sites/site-schedule'
import type { AuditLogResponse } from '@/types/audit'
import type { AssignmentExportRequest, ExportDownloadResponse, ExportResponse } from '@/types/export'
import type { DeviceReplacementRequest, DeviceResponse, RevokeDeviceRequest } from '@/types/device'
import type { DecideSessionRequest, WorkSessionResponse } from '@/types/attendance'
import type { CheckResponse, TriggerCheckRequest } from '@/types/check'
import { adjustmentHandlers } from '@/mocks/adjustment-handlers'
import { checkScheduleHandlers } from '@/mocks/check-schedule-handlers'
import { missionOverviewHandlers } from '@/mocks/mission-overview-handlers'
import { periodHandlers } from '@/mocks/period-handlers'
import { periodTotalsHandlers } from '@/mocks/period-totals-handlers'
import type { AssignTeamLeadRequest, CreateTeamRequest, TeamMembersRequest, TeamResponse, UpdateTeamRequest } from '@/types/team'
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
    settings: { radiusM: 100, lateToleranceMin: 15, maxAccuracyM: 50, missingExitAfterMin: 60, checksPerSession: 3, activationSmsRequired: true, retention: { selfieDays: 30, dataYears: 5, anonymizeAfterYears: 5, exportDays: 7 } },
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
  supervisorUserId: mission.supervisorId ?? null,
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

// Journal d'audit fictif : une action toutes les 5 h environ sur le dernier mois, les plus récentes d'abord.
const auditLogs: AuditLogResponse[] = Array.from({ length: 140 }, (_, index) => {
  const kinds = [
    { action: 'SELFIE_VIEWED', target: `session:ses_mock_${(index % 6) + 1}`, metadata: { kind: 'SESSION_IN' } },
    { action: 'DEVICE_REVOKED', target: `device:${devices[index % devices.length]!.id}`, before: { status: 'ACTIVE' }, after: { status: 'REVOKED' }, reason: 'Téléphone déclaré perdu par l’agent.' },
    { action: 'SESSION_DECIDED', target: `session:ses_mock_${(index % 6) + 1}`, before: { status: 'PENDING_REVIEW' }, after: { status: 'VALIDATED' } },
    { action: 'CHECK_TRIGGERED', target: `team:${mockTeams[index % mockTeams.length]!.id}`, metadata: { agents: 4 } },
  ]
  const kind = kinds[index % kinds.length]!
  return {
    id: `aud_mock_${String(index + 1).padStart(3, '0')}`,
    tenantId: tenants[index % 3 === 0 ? 1 % tenants.length : 0]!.id,
    actorId: index % 9 === 8 ? null : ['user-1', 'user-2'][index % 2],
    deviceId: index % 7 === 3 ? devices[0]!.id : null,
    outcome: index % 11 === 5 ? 'FAILURE' : 'SUCCESS',
    requestId: `req_mock_${index + 1}`,
    at: new Date(Date.now() - index * 5 * 3600_000 - 7 * 60_000).toISOString(),
    ...kind,
  }
})

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

// Pointages fictifs : une session par cas à examiner (anomalie, sortie manquante, en cours, déjà décidée).
function mockSession(index: number, userId: string, siteId: string, dayOffset: number, inTime: string, outTime: string | null, extra: Partial<WorkSessionResponse> = {}): WorkSessionResponse {
  const day = addDays(mockWeek, dayOffset)
  const inAt = new Date(`${day}T${inTime}:00`).toISOString()
  const outAt = outTime ? new Date(`${day}T${outTime}:00`).toISOString() : undefined
  return {
    id: `ses_mock_${index}`, userId, siteId, assignmentId: `asg_mock_${index}`, inAt, outAt,
    minutes: outAt ? (new Date(outAt).getTime() - new Date(inAt).getTime()) / 60_000 : undefined,
    lateMin: 0, earlyMin: 0, day, flags: [], status: outAt ? 'CLOSED' : 'OPEN', validation: 'PENDING', rulesVersion: '2026.10', periodId: 'per_mock_003', ...extra,
  }
}
const sessions: WorkSessionResponse[] = [
  mockSession(1, 'user-4', 'site-1', 0, '07:12', '15:04', { lateMin: 12, flags: ['OUT_OF_GEOFENCE', 'LOW_ACCURACY'] }),
  mockSession(2, 'user-3', 'site-1', 0, '15:00', null, { status: 'MISSING_EXIT', flags: ['QR_MISMATCH'] }),
  mockSession(3, 'user-4', 'site-1', 1, '06:58', '15:01', { validation: 'AUTO_VALIDATED' }),
  mockSession(4, 'user-7', 'site-2', 1, '22:05', '06:00', { lateMin: 5, flags: ['MOCK_POSITION'], validation: 'REJECTED', validatedBy: 'user-2', validatedAt: '2026-10-20T09:00:00.000Z', periodId: 'per_mock_001' }),
  mockSession(5, 'user-4', 'site-1', 2, '07:01', null, { flags: ['CLOCK_DRIFT'] }),
]

// Contrôles de présence fictifs : un contrôle passé déjà confirmé, les suivants naissent du bouton « Lancer un contrôle ».
const checks: CheckResponse[] = [
  { id: 'chk_mock_1', campaignId: 'ccp_mock_1', teamId: 'team-1', sessionId: 'ses_mock_1', userId: 'user-4', dueAt: '2026-10-26T10:00:00.000Z', deadlineAt: '2026-10-26T10:15:00.000Z', result: 'ANSWERED', answeredAt: '2026-10-26T10:06:00.000Z', attestedBy: 'user-3', remote: true, triggeredBy: 'user-2' },
  { id: 'chk_mock_2', campaignId: 'ccp_mock_1', teamId: 'team-1', sessionId: 'ses_mock_2', userId: 'user-3', dueAt: '2026-10-26T10:00:00.000Z', deadlineAt: '2026-10-26T10:15:00.000Z', result: 'MISSED', remote: false, triggeredBy: 'user-2' },
]
const lastCheckByTeam: Record<string, number> = {}

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

const mockExports = new Map<string, { item: ExportResponse; rows: AssignmentResponse[]; tooMany: boolean }>()

// L'API engendre le matricule ; l'entreprise le remplace ensuite par import.
const generatedMatricule = () => `GEN-${String(Date.now()).slice(-6)}`

const isActiveSupervisor = (userId?: string) => users.some((user) => user.id === userId && user.status === 'ACTIVE' && user.roles.includes('SUPERVISOR'))

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
  ...periodHandlers(api, problem),
  ...periodTotalsHandlers(api, problem),
  ...missionOverviewHandlers(api, problem, () => sites),
  ...adjustmentHandlers(api, problem, () => sessions),
  ...checkScheduleHandlers(api, problem),
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
  http.get(api('/audit-logs'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const callerId = request.headers.get('Authorization')?.replace('Bearer mock-access-token-', '')
    if (params.get('tenantId') && !users.some((user) => user.id === callerId && user.roles.includes('OPERATOR'))) {
      return problem(403, 'FORBIDDEN', 'Le filtre tenantId est réservé à l’opérateur.')
    }
    const from = params.get('from')
    const to = params.get('to')
    if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to))) || (from && to && from > to)) {
      return problem(400, 'VALIDATION_FAILED', 'Dates invalides ou début après fin.')
    }
    const filtered = auditLogs.filter((log) => (['tenantId', 'action', 'target', 'actorId', 'outcome'] as const)
      .every((key) => !params.get(key) || log[key] === params.get(key))
      && (!from || log.at >= from) && (!to || log.at <= to))
    return HttpResponse.json(page(request, filtered))
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
  http.put(api('/users/:id/roles'), async ({ params, request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock-elevated-token')) {
      return problem(403, 'STEP_UP_REQUIRED', 'Une ré-authentification TOTP récente est requise.')
    }
    const user = users.find((item) => item.id === String(params.id))
    if (!user) return problem(404, 'NOT_FOUND', 'Utilisateur introuvable.')
    const { roles } = (await request.json()) as { roles?: UserResponse['roles'] }
    if (!roles?.length || roles.some((role) => !['SUPERVISOR', 'TEAM_LEAD', 'AGENT'].includes(role))) return problem(403, 'ROLE_NOT_ASSIGNABLE', 'Ce rôle n’est pas attribuable.')
    if (user.roles.includes('ADMIN')) return problem(409, 'LAST_ADMIN_REQUIRED', 'L’entreprise doit garder un administrateur.')
    Object.assign(user, { roles, updatedAt: now() })
    return HttpResponse.json(user)
  }),
  http.post(api('/users/:id/device-replacement'), async ({ params, request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock-elevated-token')) {
      return problem(403, 'STEP_UP_REQUIRED', 'Une ré-authentification TOTP récente est requise.')
    }
    const user = users.find((item) => item.id === String(params.id))
    if (!user) return problem(404, 'NOT_FOUND', 'Utilisateur introuvable.')
    if (user.status === 'DISABLED' || !user.roles.some((role) => ['AGENT', 'TEAM_LEAD'].includes(role))) {
      return problem(409, 'DEVICE_REPLACEMENT_NOT_ALLOWED', 'Ce compte n’a pas de téléphone, ou il est désactivé.')
    }
    const { reason } = ((await request.json().catch(() => ({}))) ?? {}) as DeviceReplacementRequest
    const revoked = devices.filter((item) => item.userId === user.id && item.status === 'ACTIVE')
    revoked.forEach((device) => Object.assign(device, { status: 'REVOKED', revokedAt: now(), revokedReason: reason?.trim() || 'Remplacement de téléphone' }))
    Object.assign(user, { status: 'PENDING_ACTIVATION', updatedAt: now() })
    return HttpResponse.json({ userId: user.id, status: user.status, revokedDeviceIds: revoked.map((device) => device.id) })
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
  // Import des affectations : en mode démo, seul le CSV est lu (matricule ; site ; date ; début ; fin), fuseau UTC.
  http.post(api('/assignments/import'), async ({ request }) => {
    const dryRun = new URL(request.url).searchParams.get('dryRun') === 'true'
    const file = (await request.formData()).get('file')
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.csv')) return problem(400, 'ASSIGNMENT_IMPORT_FILE_INVALID', 'En mode démonstration, seul un fichier CSV peut être lu.')
    const lines = (await file.text()).replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) return problem(400, 'ASSIGNMENT_IMPORT_FILE_INVALID', 'Le fichier ne contient aucune ligne de données.')
    if (lines.length > 2001) return problem(413, 'ASSIGNMENT_IMPORT_FILE_INVALID', 'Le fichier dépasse 2 000 lignes.')
    const separator = lines[0]!.includes(';') ? ';' : ','
    const header = lines[0]!.split(separator).map((cell) => cell.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim())
    const column = (...names: string[]) => header.findIndex((cell) => names.some((name) => cell.startsWith(name)))
    const [matriculeCol, siteCol, dateCol, startCol, endCol] = [column('matricule'), column('site'), column('date', 'jour'), column('debut', 'heure de debut'), column('fin', 'heure de fin')]
    if ([matriculeCol, siteCol, dateCol, startCol, endCol].includes(-1)) return problem(400, 'ASSIGNMENT_IMPORT_FILE_INVALID', 'En-tête attendu : matricule, site, date, début, fin.')
    const readDate = (value: string) => {
      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value) ?? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
      if (!match) return null
      const [day, month, year] = value.includes('/') ? [match[1], match[2], match[3]] : [match[3], match[2], match[1]]
      return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
    }
    const readTime = (value: string) => {
      const match = /^(\d{1,2})\s*[:hH]\s*(\d{2})?$/.exec(value)
      return match && Number(match[1]) < 24 ? `${match[1]!.padStart(2, '0')}:${match[2] ?? '00'}` : null
    }
    const rejected: AssignmentImportRejection[] = []
    const accepted: { rowNumber: number; userId: string; siteId: string; startAt: string; endAt: string }[] = []
    lines.slice(1).forEach((line, index) => {
      const cells = line.split(separator).map((cell) => cell.trim())
      const row = { rowNumber: index + 2, matricule: cells[matriculeCol] ?? '', site: cells[siteCol] ?? '', date: cells[dateCol] ?? '', start: cells[startCol] ?? '', end: cells[endCol] ?? '' }
      const reject = (reason: string, extra: Partial<AssignmentImportRejection> = {}) => { rejected.push({ ...row, reason, ...extra }) }
      if (!row.matricule) return reject('MATRICULE_EMPTY')
      if (!row.site) return reject('SITE_EMPTY')
      const user = users.find((item) => item.matricule === row.matricule)
      if (!user) return reject('MATRICULE_UNKNOWN')
      const site = sites.find((item) => item.id === row.site || item.name.toLowerCase() === row.site.toLowerCase())
      if (!site) return reject('SITE_UNKNOWN')
      if (site.status === 'ARCHIVED') return reject('SITE_ARCHIVED')
      if (!site.teamId) return reject('SITE_WITHOUT_TEAM')
      const day = readDate(row.date); const start = readTime(row.start); const end = readTime(row.end)
      if (!day) return reject('DATE_UNREADABLE')
      if (!start) return reject('START_UNREADABLE')
      if (!end) return reject('END_UNREADABLE')
      if (user.status !== 'ACTIVE' || !user.roles.some((role) => ['AGENT', 'TEAM_LEAD'].includes(role))) return reject('AGENT_INVALID')
      if (user.teamId !== site.teamId) return reject('AGENT_NOT_IN_SITE_TEAM')
      const startAt = new Date(`${day}T${start}:00.000Z`)
      let endAt = new Date(`${day}T${end}:00.000Z`)
      // Une fin avant le début passe au lendemain (poste de nuit).
      if (endAt <= startAt) endAt = new Date(endAt.getTime() + 24 * 3_600_000)
      const minutes = (endAt.getTime() - startAt.getTime()) / 60_000
      if (minutes < 15) return reject('SLOT_TOO_SHORT')
      if (minutes > 24 * 60) return reject('SLOT_TOO_LONG')
      const slot = { startAt: startAt.toISOString(), endAt: endAt.toISOString() }
      const sameFile = accepted.find((item) => item.userId === user.id && overlaps(item, slot))
      if (sameFile) return reject('OVERLAP_IN_FILE', { conflictingRowNumber: sameFile.rowNumber })
      const existing = assignments.find((item) => item.userId === user.id && item.status === 'PLANNED' && overlaps(item, slot))
      if (existing) return reject('OVERLAP_EXISTING', { conflictingAssignmentId: existing.id })
      accepted.push({ rowNumber: row.rowNumber, userId: user.id, siteId: site.id, ...slot })
    })
    const report = {
      read: lines.length - 1, planned: accepted.length, rejected, applied: false,
      ...(accepted.length ? { from: accepted.map((item) => item.startAt).sort()[0], to: accepted.map((item) => item.endAt).sort().at(-1) } : {}),
    }
    if (rejected.length && !dryRun) return HttpResponse.json({ title: 'ASSIGNMENT_IMPORT_REJECTED', status: 422, code: 'ASSIGNMENT_IMPORT_REJECTED', detail: 'Le fichier comporte des lignes refusées : aucun créneau n’a été créé.', ...report }, { status: 422, headers: { 'Content-Type': 'application/problem+json' } })
    if (!dryRun) {
      const timestamp = now()
      accepted.forEach((item, index) => assignments.push({
        id: `asg_${Date.now()}_${index}`, userId: item.userId, siteId: item.siteId, startAt: item.startAt, endAt: item.endAt,
        day: toDayKey(new Date(item.startAt)), durationMin: (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 60_000,
        status: 'PLANNED', createdAt: timestamp, updatedAt: timestamp,
      }))
      report.applied = true
    }
    return HttpResponse.json(report)
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

  // Exports : l'état avance à chaque consultation (PENDING, RUNNING, READY). Le fichier de démonstration est un CSV.
  http.post(api('/exports/assignments'), async ({ request }) => {
    const payload = (await request.json()) as AssignmentExportRequest
    if (!['XLSX', 'PDF'].includes(payload.format)) return problem(400, 'VALIDATION_FAILED', 'Format invalide : XLSX ou PDF.')
    const filtered = assignments.filter((item) =>
      (['userId', 'siteId', 'status', 'day'] as const).every((key) => !payload[key] || item[key] === payload[key])
      && (!payload.from || item.startAt >= payload.from) && (!payload.to || item.startAt < payload.to))
    const timestamp = now()
    const extension = payload.format.toLowerCase()
    const item: ExportResponse = {
      id: `exp_mock_${Date.now()}`, type: 'ASSIGNMENTS', format: payload.format, status: 'PENDING', params: { ...payload },
      rowCount: filtered.length, filename: `affectations-des-agents-${timestamp.slice(0, 10)}.${extension}`,
      createdAt: timestamp, availableUntil: new Date(Date.now() + 7 * 24 * 3_600_000).toISOString(),
    }
    const limit = payload.format === 'PDF' ? 5000 : 200_000
    mockExports.set(item.id, { item, rows: filtered, tooMany: filtered.length > limit })
    return HttpResponse.json(item, { status: 202 })
  }),
  http.get(api('/exports/:id'), ({ params }) => {
    const entry = mockExports.get(String(params.id))
    if (!entry) return problem(404, 'NOT_FOUND', 'Export introuvable.')
    if (entry.item.status === 'PENDING') entry.item.status = 'RUNNING'
    else if (entry.item.status === 'RUNNING') {
      Object.assign(entry.item, entry.tooMany ? { status: 'FAILED', errorCode: 'EXPORT_ROW_LIMIT_EXCEEDED' } : { status: 'READY', completedAt: now() })
    }
    return HttpResponse.json(entry.item)
  }),
  http.get(api('/exports/:id/download'), ({ params }) => {
    const entry = mockExports.get(String(params.id))
    if (!entry) return problem(404, 'NOT_FOUND', 'Export introuvable.')
    if (entry.item.status !== 'READY') return problem(409, 'EXPORT_NOT_READY', 'Le fichier est encore en production, ou a échoué.')
    const csv = ['agent;site;debut;fin', ...entry.rows.map((row) => [row.userId, row.siteId, row.startAt, row.endAt].join(';'))].join('\n')
    const body: ExportDownloadResponse = { url: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`, expiresIn: 300, filename: entry.item.filename ?? 'export.csv' }
    return HttpResponse.json(body)
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
  // Lien d'invitation fictif : tout jeton est accepté, sauf « expire » pour voir le refus.
  http.post(api('/auth/password/setup'), async ({ request }) => {
    const payload = (await request.json()) as SetupPasswordRequest
    if (!payload.token || payload.token === 'expire') return problem(401, 'PASSWORD_SETUP_TOKEN_INVALID', 'Le lien d’invitation est invalide ou expiré.')
    if (payload.password === 'Password123') return problem(400, 'PASSWORD_BREACHED', 'Ce mot de passe figure dans une fuite de données connue.')
    return new HttpResponse(null, { status: 204 })
  }),
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
      settings: payload.settings ?? { radiusM: 100, lateToleranceMin: 15, maxAccuracyM: 50, missingExitAfterMin: 60, checksPerSession: 3, activationSmsRequired: true, retention: { selfieDays: 30, dataYears: 5, anonymizeAfterYears: 5, exportDays: 7 } },
      createdAt: timestamp, updatedAt: timestamp,
    }
    tenants.unshift(tenant)
    return HttpResponse.json(tenant, { status: 201 })
  }),
  http.patch(api('/platform/tenants/settings/:id'), async ({ params, request }) => {
    const index = tenants.findIndex((item) => item.id === String(params.id))
    if (index < 0) return problem(404, 'NOT_FOUND', "L’entreprise demandée n’existe pas.")
    const { settings } = (await request.json()) as Required<Pick<UpdateTenantRequest, 'settings'>>
    tenants[index] = { ...tenants[index]!, settings, updatedAt: now() }
    return HttpResponse.json(settings)
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
      matricule: generatedMatricule(),
      names: payload.names,
      email: payload.email,
      phone: payload.phone,
      roles: [payload.role],
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
      // Une adresse contenant « echec » simule un courriel d'invitation qui n'est pas parti.
      invitationSent: !payload.email?.includes('echec'),
    }
    users.unshift(user)
    return HttpResponse.json(user, { status: 201 })
  }),
  http.post(api('/platform/tenants/:id/users/:userId/invitation'), ({ params }) => {
    const user = users.find((item) => item.id === String(params.userId))
    if (!user) return problem(404, 'NOT_FOUND', 'Le compte n’existe pas.')
    if (!user.email) return problem(409, 'PASSWORD_SETUP_NOT_ALLOWED', 'Ce compte n’a pas d’adresse électronique.')
    return new HttpResponse(null, { status: 202 })
  }),
  http.get(api('/platform/offers'), ({ request }) => HttpResponse.json(page(request, offers))),
  http.post(api('/platform/offers'), async ({ request }) => {
    const payload = (await request.json()) as CreateOfferRequest
    const timestamp = now()
    const offer: OfferResponse = { id: `offer-${Date.now()}`, code: `OFFRE-${offers.length + 1}`, ...payload, status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }
    offers.unshift(offer)
    return HttpResponse.json(offer, { status: 201 })
  }),

  // Import des matricules : en mode démo, seul le CSV est lu (nom ; téléphone ; matricule).
  http.post(api('/users/matricules/import'), async ({ request }) => {
    const dryRun = new URL(request.url).searchParams.get('dryRun') === 'true'
    const file = (await request.formData()).get('file')
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.csv')) return problem(400, 'MATRICULE_IMPORT_FILE_INVALID', 'En mode démonstration, seul un fichier CSV peut être lu.')
    const lines = (await file.text()).replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) return problem(400, 'MATRICULE_IMPORT_EMPTY', 'Le fichier ne contient aucune ligne de données.')
    const separator = lines[0]!.includes(';') ? ';' : ','
    const header = lines[0]!.split(separator).map((cell) => cell.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim())
    const column = (...names: string[]) => header.findIndex((cell) => names.some((name) => cell.startsWith(name)))
    const [nameCol, phoneCol, matriculeCol] = [column('nom', 'name'), column('tel', 'numero', 'phone'), column('matricule')]
    if ([nameCol, phoneCol, matriculeCol].includes(-1)) return problem(400, 'MATRICULE_IMPORT_FILE_INVALID', 'En-tête attendu : nom, téléphone, matricule.')
    const digits = (value: string) => value.replace(/\D/g, '').slice(-10)
    const rows = lines.slice(1).map((line, index) => {
      const cells = line.split(separator).map((cell) => cell.trim())
      return { rowNumber: index + 2, name: cells[nameCol] ?? '', phone: cells[phoneCol] ?? '', matricule: cells[matriculeCol] ?? '' }
    })
    const report = { read: rows.length, matched: 0, unchanged: 0, rejected: [] as { rowNumber: number; reason: string; name: string; phone: string; matricule: string }[], warnings: [] as { rowNumber: number; reason: string; phone: string }[], applied: false }
    const updates: { user: UserResponse; matricule: string }[] = []
    rows.forEach((row) => {
      const reject = (reason: string) => report.rejected.push({ ...row, reason })
      if (digits(row.phone).length < 8) return reject('PHONE_UNREADABLE')
      if (rows.filter((other) => digits(other.phone) === digits(row.phone)).length > 1) return reject('PHONE_DUPLICATED_IN_FILE')
      if (!row.matricule) return reject('MATRICULE_EMPTY')
      if (rows.filter((other) => other.matricule === row.matricule).length > 1) return reject('MATRICULE_DUPLICATED_IN_FILE')
      const user = users.find((item) => digits(item.phone) === digits(row.phone))
      if (!user) return reject('PHONE_UNKNOWN')
      if (users.some((item) => item.id !== user.id && item.matricule === row.matricule)) return reject('MATRICULE_ALREADY_USED')
      if (row.name && row.name.toLowerCase() !== user.names.toLowerCase()) report.warnings.push({ rowNumber: row.rowNumber, reason: 'NAME_DIFFERS', phone: row.phone })
      if (user.matricule === row.matricule) report.unchanged += 1
      else { report.matched += 1; updates.push({ user, matricule: row.matricule }) }
    })
    if (report.rejected.length && !dryRun) return HttpResponse.json({ title: 'MATRICULE_IMPORT_REJECTED', status: 422, code: 'MATRICULE_IMPORT_REJECTED', detail: 'Le fichier comporte des lignes refusées : aucune modification.', ...report }, { status: 422, headers: { 'Content-Type': 'application/problem+json' } })
    if (!dryRun) {
      updates.forEach(({ user, matricule }) => Object.assign(user, { matricule, updatedAt: now() }))
      report.applied = true
    }
    return HttpResponse.json(report)
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
    const user: UserResponse = { id: `user-${Date.now()}`, matricule: generatedMatricule(), names: payload.names, email: payload.email, phone: payload.phone, roles: [payload.role].flat(), teamId: payload.teamId, status: 'PENDING_ACTIVATION', createdAt: timestamp, updatedAt: timestamp }
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
    users[index] = { ...users[index]!, ...payload, updatedAt: now() }
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
    if (!isActiveSupervisor(payload.supervisorUserId)) return problem(409, 'MISSION_SUPERVISOR_INVALID', 'Le superviseur doit être un compte SUPERVISOR actif.')
    const timestamp = now()
    const mission: MissionResponse = {
      id: `mission-${Date.now()}`,
      // Référence attribuée par le serveur.
      code: `MIS-${new Date().getFullYear()}-${String(missions.length + 1).padStart(3, '0')}`,
      name: payload.name,
      supervisorUserId: payload.supervisorUserId,
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
    if (payload.supervisorUserId && !isActiveSupervisor(payload.supervisorUserId)) return problem(409, 'MISSION_SUPERVISOR_INVALID', 'Le superviseur doit être un compte SUPERVISOR actif.')
    Object.assign(mission, payload, { updatedAt: now() })
    return HttpResponse.json(mission)
  }),
  http.put(api('/missions/:id/supervisor'), async ({ params, request }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    if (!mission) return problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
    const payload = (await request.json()) as AssignMissionSupervisorRequest
    if (!isActiveSupervisor(payload.userId)) return problem(409, 'MISSION_SUPERVISOR_INVALID', 'Le superviseur doit être un compte SUPERVISOR actif.')
    Object.assign(mission, { supervisorUserId: payload.userId, updatedAt: now() })
    return HttpResponse.json(mission)
  }),
  http.post(api('/missions/:id/sites'), async ({ params, request }) => {
    const mission = missions.find((item) => item.id === String(params.id))
    if (!mission) return problem(404, 'NOT_FOUND', "La mission demandée n’existe pas.")
    if (mission.status === 'CLOSED') return problem(409, 'MISSION_STATUS_CONFLICT', 'Une mission clôturée n’accueille plus de site.')
    const { siteIds } = (await request.json()) as AssignMissionSitesRequest
    const ids = [...new Set(siteIds)]
    const problems = ids.flatMap((siteId) => {
      const site = sites.find((item) => item.id === siteId)
      if (!site) return [{ siteId, reason: 'SITE_NOT_FOUND' }]
      if (site.status === 'ARCHIVED') return [{ siteId, reason: 'SITE_ARCHIVED' }]
      if (site.missionId && site.missionId !== mission.id) return [{ siteId, reason: 'SITE_IN_OTHER_MISSION', currentMissionId: site.missionId }]
      if (mission.status === 'OPEN' && !site.teamId) return [{ siteId, reason: 'SITE_WITHOUT_TEAM' }]
      return []
    })
    if (problems.length) {
      return HttpResponse.json({ title: 'SITES_NOT_ASSIGNABLE', status: 409, detail: 'Certains sites ne peuvent pas être rattachés à cette mission.', code: 'SITES_NOT_ASSIGNABLE', problems }, { status: 409, headers: { 'Content-Type': 'application/problem+json' } })
    }
    const alreadyAssigned = ids.filter((siteId) => sites.find((item) => item.id === siteId)?.missionId === mission.id)
    const assigned = ids.filter((siteId) => !alreadyAssigned.includes(siteId))
    assigned.forEach((siteId) => { Object.assign(sites.find((item) => item.id === siteId)!, { missionId: mission.id, updatedAt: now() }) })
    return HttpResponse.json({ missionId: mission.id, assigned, alreadyAssigned })
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
  // Désigner le chef : step-up TOTP exigé, choisi parmi les membres ; l'ancien chef perd le rôle s'il ne dirige plus d'équipe.
  http.put(api('/teams/:id/lead'), async ({ params, request }) => {
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock-elevated-token')) {
      return problem(403, 'STEP_UP_REQUIRED', 'Une ré-authentification TOTP récente est requise.')
    }
    const team = teams.find((item) => item.id === String(params.id))
    if (!team) return problem(404, 'NOT_FOUND', "L’équipe demandée n’existe pas.")
    const { userId } = (await request.json()) as AssignTeamLeadRequest
    const lead = users.find((user) => user.id === userId)
    if (!lead) return problem(404, 'NOT_FOUND', 'Compte introuvable.')
    if (lead.teamId !== team.id) return problem(409, 'TEAM_LEAD_NOT_MEMBER', 'Le chef doit être choisi parmi les membres de l’équipe.')
    const previous = users.find((user) => user.id === team.leadUserId)
    team.leadUserId = lead.id
    team.updatedAt = now()
    if (!lead.roles.includes('TEAM_LEAD')) lead.roles = [...new Set<UserResponse['roles'][number]>([...lead.roles, 'AGENT', 'TEAM_LEAD'])]
    if (previous && previous.id !== lead.id && !teams.some((item) => item.leadUserId === previous.id)) {
      previous.roles = [...previous.roles.filter((role) => role !== 'TEAM_LEAD'), 'AGENT']
    }
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
  http.get(api('/checks'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const filtered = checks
      .filter((check) => (['teamId', 'campaignId', 'userId', 'result'] as const).every((key) => !params.get(key) || check[key] === params.get(key)))
      .sort((a, b) => b.dueAt.localeCompare(a.dueAt))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/checks/:id/selfie'), ({ params }) => {
    const check = checks.find((item) => item.id === String(params.id))
    if (!check) return problem(404, 'NOT_FOUND', 'Contrôle introuvable ou hors périmètre.')
    if (check.result !== 'ANSWERED') return problem(404, 'CHECK_SELFIE_UNAVAILABLE', 'Aucun selfie rattaché à ce contrôle.')
    return HttpResponse.json({ url: '/icon.svg', expiresIn: 300 })
  }),
  http.post(api('/checks/trigger'), async ({ request }) => {
    const { teamId } = (await request.json()) as TriggerCheckRequest
    const team = teams.find((item) => item.id === teamId)
    if (!team) return problem(404, 'NOT_FOUND', 'L’équipe n’existe pas ou sort du périmètre.')
    if (!team.leadUserId) return problem(409, 'CHECK_TEAM_WITHOUT_LEAD', 'L’équipe n’a pas de chef d’équipe.')
    if (Date.now() - (lastCheckByTeam[teamId] ?? 0) < 60 * 60_000) return problem(429, 'CHECK_TRIGGER_RATE_LIMITED', 'Un contrôle a déjà été lancé pour cette équipe.')
    const teamSiteIds = new Set(sites.filter((site) => site.teamId === teamId).map((site) => site.id))
    const open = sessions.filter((session) => teamSiteIds.has(session.siteId) && session.status === 'OPEN')
    if (!open.length) return problem(409, 'CHECK_NO_OPEN_SESSION', 'Aucun agent de l’équipe n’est en session ouverte.')
    lastCheckByTeam[teamId] = Date.now()
    const campaignId = `ccp_${Date.now()}`
    const dueAt = now()
    const deadlineAt = new Date(Date.now() + 15 * 60_000).toISOString()
    const created: CheckResponse[] = open.map((session, index) => ({
      id: `chk_${Date.now()}_${index}`, campaignId, teamId, sessionId: session.id, userId: session.userId,
      dueAt, deadlineAt, result: 'PENDING', remote: false, triggeredBy: 'user-2',
    }))
    checks.unshift(...created)
    return HttpResponse.json({ campaignId, teamId, dueAt, deadlineAt, checks: created }, { status: 201 })
  }),
  http.get(api('/sessions'), ({ request }) => {
    const params = new URL(request.url).searchParams
    const filtered = sessions
      .filter((session) => (['userId', 'siteId', 'status', 'validation'] as const).every((key) => !params.get(key) || session[key] === params.get(key)))
      .filter((session) => params.get('flagged') !== 'true' || session.flags.length > 0)
      .sort((a, b) => b.inAt.localeCompare(a.inAt))
    return HttpResponse.json(page(request, filtered))
  }),
  http.get(api('/sessions/:id'), ({ params }) => {
    const session = sessions.find((item) => item.id === String(params.id))
    return session ? HttpResponse.json(session) : problem(404, 'NOT_FOUND', 'Session introuvable ou hors périmètre.')
  }),
  http.get(api('/sessions/:id/selfie'), ({ params }) => {
    const session = sessions.find((item) => item.id === String(params.id))
    if (!session || session.id === 'ses_mock_3') return problem(404, 'NOT_FOUND', 'Session introuvable, ou aucun selfie rattaché.')
    return HttpResponse.json({ url: '/icon.svg', expiresIn: 300 })
  }),
  http.post(api('/sessions/:id/decision'), async ({ params, request }) => {
    const session = sessions.find((item) => item.id === String(params.id))
    if (!session) return problem(404, 'NOT_FOUND', 'Session introuvable ou hors périmètre.')
    const payload = (await request.json()) as DecideSessionRequest
    if (payload.decision === 'REJECT' && (payload.reason?.trim().length ?? 0) < 3) return problem(400, 'VALIDATION_FAILED', 'Le motif du rejet est obligatoire.')
    if (session.validation !== 'PENDING') return problem(409, 'SESSION_ALREADY_DECIDED', 'Cette session a déjà été décidée.')
    if (session.status === 'OPEN') return problem(409, 'SESSION_NOT_CLOSED', 'La session est encore en cours.')
    Object.assign(session, { validation: payload.decision === 'VALIDATE' ? 'VALIDATED' : 'REJECTED', validatedBy: 'user-2', validatedAt: now() })
    return HttpResponse.json(session)
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
