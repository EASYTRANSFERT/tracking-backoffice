import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { teamService } from '@/Services/team.service'
import { userService } from '@/Services/user.service'
import { missionService } from '@/Services/mission.service'
import { siteService } from '@/Services/site.service'
import { mockEnterpriseUsers, mockMissions, mockTeams } from '@/mocks/administrator-data'
import type { EnterpriseUser, EnterpriseUserInput, Mission, MissionInput, Site, SiteInput, SitePoint, Team, TeamInput } from '@/types/administrator'
import type { CreateMissionRequest, MissionResponse, UpdateMissionRequest } from '@/types/mission'
import type { CreateSiteRequest, SiteLocation, SiteResponse, UpdateSiteRequest } from '@/types/site'
import type { TeamResponse } from '@/types/team'
import type { ApiUserRole, UserResponse } from '@/types/user'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const PAGE_SIZE = 10
// L'API n'accepte qu'un point : on envoie le centre des trois points du périmètre.
function perimeterLocation(points: SitePoint[]): SiteLocation {
  const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length
  const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length
  return { type: 'Point', coordinates: [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))] }
}

// Points, ville et image du QR n'existent pas côté API : on conserve la copie locale existante.
function mapSite(site: SiteResponse, previous?: Site): Site {
  const [longitude, latitude] = site.location.coordinates
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    locationDescription: site.locationDescription,
    city: previous?.city,
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    radiusM: site.radiusM,
    points: previous?.points,
    missionId: site.missionId,
    teamId: site.teamId,
    managerId: site.managerId,
    qrCode: '',
    qrImage: previous?.qrImage,
    qrRotatedAt: site.qrRotatedAt,
    status: site.status === 'ACTIVE' ? 'active' : 'inactive',
    createdAt: site.createdAt,
  }
}
const roleToApi: Record<EnterpriseUser['role'], ApiUserRole> = {
  administrator: 'ADMIN', supervisor: 'SUPERVISOR', teamLeader: 'TEAM_LEAD', agent: 'AGENT',
}
const roleFromApi: Partial<Record<ApiUserRole, EnterpriseUser['role']>> = {
  ADMIN: 'administrator', SUPERVISOR: 'supervisor', TEAM_LEAD: 'teamLeader', AGENT: 'agent',
}

function mapUser(user: UserResponse): EnterpriseUser {
  const [firstName = '', ...lastNameParts] = user.names.trim().split(/\s+/)
  const apiRole = user.roles.find((role) => roleFromApi[role])
  return {
    id: user.id,
    employeeNumber: user.matricule,
    firstName,
    lastName: lastNameParts.join(' '),
    email: user.email ?? '',
    phone: user.phone,
    role: apiRole ? roleFromApi[apiRole]! : 'agent',
    teamId: user.teamId,
    status: user.status === 'ACTIVE' ? 'active' : user.status === 'DISABLED' ? 'disabled' : 'invited',
    createdAt: user.createdAt,
  }
}

function mapTeam(team: TeamResponse): Team {
  return {
    id: team.id,
    name: team.name,
    leadUserId: team.leadUserId ?? undefined,
    supervisorUserId: team.supervisorUserId,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }
}

const missionStatusFromApi: Record<MissionResponse['status'], Mission['status']> = {
  PLANNED: 'scheduled',
  OPEN: 'ongoing',
  CLOSED: 'completed',
}

function mapMission(mission: MissionResponse): Mission {
  const mockScope = mockMode
    ? mockMissions.find((item) => item.id === mission.id)
    : undefined

  return {
    id: mission.id,
    code: mission.code,
    title: mission.name,
    notes: mission.description ?? '',
    startAt: mission.startAt,
    endAt: mission.endAt,
    status: missionStatusFromApi[mission.status],
    openedAt: mission.openedAt,
    closedAt: mission.closedAt,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
    siteId: mockScope?.siteId,
    supervisorId: mockScope?.supervisorId,
    teamId: mockScope?.teamId,
  }
}

function toIso(value?: string) {
  return value ? new Date(value).toISOString() : undefined
}

export const useAdministratorStore = defineStore('administrator', () => {
  const users = ref<EnterpriseUser[]>(mockMode ? structuredClone(mockEnterpriseUsers) : [])
  const supervisors = ref<EnterpriseUser[]>([])
  const teams = ref<Team[]>(mockMode ? structuredClone(mockTeams) : [])
  const sites = ref<Site[]>([])
  const missions = ref<Mission[]>([])
  const isDirectoryLoading = ref(false)
  const hasLoadedDirectory = ref(false)
  const isMissionsLoading = ref(false)
  const hasLoadedMissions = ref(false)
  const isSitesLoading = ref(false)
  const hasLoadedSites = ref(false)
  const canImportSites = computed(() => mockMode)
  const canReactivateUsers = computed(() => mockMode)
  const canImportUsers = computed(() => mockMode)

  const activeUsersCount = computed(() => users.value.filter(
    (user) => user.role !== 'administrator' && user.status === 'active',
  ).length)
  const pendingDeviceActivationsCount = computed(() => users.value.filter((user) => user.status === 'invited').length)
  const activeSitesCount = computed(() => sites.value.filter((site) => site.status === 'active').length)
  const ongoingMissionsCount = computed(() => missions.value.filter((mission) => mission.status === 'ongoing').length)
  const teamDirectoryUsers = computed(() => [
    ...new Map([...users.value, ...supervisors.value].map((user) => [user.id, user])).values(),
  ])

  const getUserById = (id: string) => users.value.find((user) => user.id === id)
  const getSiteById = (id: string) => sites.value.find((site) => site.id === id)
  const getMissionById = (id: string) => missions.value.find((mission) => mission.id === id)
  const getTeamById = (id: string) => teams.value.find((team) => team.id === id)
  const userNextCursor = ref<string | null>(null)
  const userCursorHistory = ref<(string | undefined)[]>([])
  const userPage = ref(1)
  const teamNextCursor = ref<string | null>(null)
  const teamCursorHistory = ref<(string | undefined)[]>([])
  const teamPage = ref(1)

  async function loadDirectory(force = false) {
    if (hasLoadedDirectory.value && !force) return
    isDirectoryLoading.value = true
    try {
      const [userPage, teamPage, supervisorPage] = await Promise.all([
        userService.list({ limit: PAGE_SIZE }),
        teamService.list({ limit: PAGE_SIZE }),
        userService.list({ limit: 200, role: 'SUPERVISOR', status: 'ACTIVE' }),
      ])
      users.value = userPage.items.map(mapUser)
      teams.value = teamPage.items.map(mapTeam)
      supervisors.value = supervisorPage.items.map(mapUser)
      userNextCursor.value = userPage.nextCursor ?? null
      teamNextCursor.value = teamPage.nextCursor ?? null
      userCursorHistory.value = []
      teamCursorHistory.value = []
      hasLoadedDirectory.value = true
    } finally {
      isDirectoryLoading.value = false
    }
  }

  async function loadMissions(force = false) {
    if (hasLoadedMissions.value && !force) return
    isMissionsLoading.value = true
    try {
      const result = await missionService.list({ limit: 200 })
      missions.value = result.items.map(mapMission)
      hasLoadedMissions.value = true
    } finally {
      isMissionsLoading.value = false
    }
  }

  async function loadMission(id: string) {
    const cached = getMissionById(id)
    if (cached) return cached
    const mission = mapMission(await missionService.findOne(id))
    replaceMission(mission)
    return mission
  }

  async function loadUserPage(cursor?: string, direction: 'next' | 'previous' | 'reset' = 'reset') {
    isDirectoryLoading.value = true
    try {
      const result = await userService.list({ cursor, limit: PAGE_SIZE })
      users.value = result.items.map(mapUser)
      userNextCursor.value = result.nextCursor ?? null
      if (direction === 'next') { userCursorHistory.value.push(cursor); userPage.value += 1 }
      else if (direction === 'previous') userPage.value = Math.max(1, userPage.value - 1)
      else { userCursorHistory.value = []; userPage.value = 1 }
    } finally { isDirectoryLoading.value = false }
  }

  async function nextUserPage() { if (userNextCursor.value) await loadUserPage(userNextCursor.value, 'next') }
  async function previousUserPage() {
    if (!userCursorHistory.value.length) return
    userCursorHistory.value.pop()
    await loadUserPage(userCursorHistory.value.at(-1), 'previous')
  }

  async function loadTeamPage(cursor?: string, direction: 'next' | 'previous' | 'reset' = 'reset') {
    isDirectoryLoading.value = true
    try {
      const result = await teamService.list({ cursor, limit: PAGE_SIZE })
      teams.value = result.items.map(mapTeam)
      teamNextCursor.value = result.nextCursor ?? null
      if (direction === 'next') { teamCursorHistory.value.push(cursor); teamPage.value += 1 }
      else if (direction === 'previous') teamPage.value = Math.max(1, teamPage.value - 1)
      else { teamCursorHistory.value = []; teamPage.value = 1 }
    } finally { isDirectoryLoading.value = false }
  }

  async function nextTeamPage() { if (teamNextCursor.value) await loadTeamPage(teamNextCursor.value, 'next') }
  async function previousTeamPage() {
    if (!teamCursorHistory.value.length) return
    teamCursorHistory.value.pop()
    await loadTeamPage(teamCursorHistory.value.at(-1), 'previous')
  }

  async function createUser(input: EnterpriseUserInput) {
    if (!input.password) throw new Error('Un mot de passe temporaire est requis.')
    const created = await userService.create({
      matricule: input.employeeNumber,
      names: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email || undefined,
      phone: input.phone,
      role: roleToApi[input.role],
      teamId: input.teamId,
      password: input.password,
    })
    users.value.unshift(mapUser(created))
    return created.id
  }

  async function updateUser(id: string, input: EnterpriseUserInput) {
    replaceUser(mapUser(await userService.update(id, {
      matricule: input.employeeNumber,
      names: `${input.firstName} ${input.lastName}`.trim(),
      email: input.email || undefined,
      phone: input.phone,
      role: roleToApi[input.role],
      teamId: input.teamId,
    })))
  }

  async function toggleUserStatus(id: string) {
    const user = getUserById(id)
    if (!user) return
    if (user.status === 'disabled') throw new Error("L’API ne fournit pas d’endpoint de réactivation utilisateur.")
    replaceUser(mapUser(await userService.disable(id)))
  }

  function replaceUser(user: EnterpriseUser) {
    const index = users.value.findIndex((item) => item.id === user.id)
    if (index >= 0) users.value[index] = user
    else users.value.unshift(user)
  }

  function importUsers(count: number) {
    if (!mockMode) throw new Error("L’API ne fournit pas encore d’endpoint d’import utilisateurs.")
    const now = Date.now()
    for (let index = 0; index < count; index += 1) {
      users.value.unshift({ id: `imported-${now}-${index}`, employeeNumber: `IMP-${String(now).slice(-4)}-${index + 1}`, firstName: 'Utilisateur', lastName: `Importé ${index + 1}`, email: `importe.${now}.${index + 1}@entreprise.ci`, phone: '+225 00 00 00 00 00', role: 'agent', status: 'invited', createdAt: new Date().toISOString() })
    }
  }

  async function createTeam(input: TeamInput) {
    const created = await teamService.create({
      name: input.name,
      supervisorUserId: input.supervisorUserId,
    })
    teams.value.unshift(mapTeam(created))
    return created.id
  }

  async function updateTeam(id: string, input: TeamInput) {
    const current = getTeamById(id)
    if (!current) throw new Error('Équipe introuvable.')
    let updated = current
    if (input.name.trim() !== current.name) {
      updated = mapTeam(await teamService.update(id, { name: input.name.trim() }))
    }
    if (input.supervisorUserId !== current.supervisorUserId) {
      updated = mapTeam(await teamService.assignSupervisor(id, { userId: input.supervisorUserId }))
    }
    replaceTeam(updated)
  }

  async function deleteTeam(id: string): Promise<boolean> {
    await teamService.remove(id)
    teams.value = teams.value.filter((team) => team.id !== id)
    return true
  }

  async function loadTeamAgentDirectory(teamId: string) {
    const result = await userService.list({ limit: 200 })
    const directory = result.items.map(mapUser)
    return {
      members: directory.filter((user) => user.teamId === teamId && ['agent', 'teamLeader'].includes(user.role)),
      available: directory.filter((user) => user.role === 'agent' && !user.teamId),
    }
  }

  async function addTeamMembers(teamId: string, userIds: string[]) {
    if (!userIds.length) return loadTeamAgentDirectory(teamId)
    replaceTeam(mapTeam(await teamService.addMembers(teamId, { userIds })))
    users.value.forEach((user) => {
      if (userIds.includes(user.id)) user.teamId = teamId
    })
    return loadTeamAgentDirectory(teamId)
  }

  async function removeTeamMembers(teamId: string, userIds: string[]) {
    if (!userIds.length) return loadTeamAgentDirectory(teamId)
    replaceTeam(mapTeam(await teamService.removeMembers(teamId, { userIds })))
    users.value.forEach((user) => {
      if (userIds.includes(user.id)) user.teamId = undefined
    })
    return loadTeamAgentDirectory(teamId)
  }

  function replaceTeam(team: Team) {
    const index = teams.value.findIndex((item) => item.id === team.id)
    if (index >= 0) teams.value[index] = team
    else teams.value.unshift(team)
  }

  async function loadSites(force = false) {
    if (hasLoadedSites.value && !force) return
    isSitesLoading.value = true
    try {
      const result = await siteService.list({ limit: 200 })
      sites.value = result.items.map((site) => mapSite(site, getSiteById(site.id)))
      hasLoadedSites.value = true
    } finally {
      isSitesLoading.value = false
    }
  }

  async function loadSite(id: string) {
    const cached = getSiteById(id)
    if (cached) return cached
    const site = mapSite(await siteService.findOne(id))
    replaceSite(site)
    return site
  }

  async function createSite(input: SiteInput) {
    if (!input.missionId || !input.managerId || input.points?.length !== 3) throw new Error('Mission, responsable et périmètre sont obligatoires.')
    const payload: CreateSiteRequest = {
      name: input.name.trim(),
      address: input.address?.trim() || undefined,
      locationDescription: input.locationDescription?.trim() || undefined,
      location: perimeterLocation(input.points),
      responsibleId: input.managerId,
      missionId: input.missionId,
    }
    const created = mapSite(await siteService.create(payload), { ...input, id: '', qrCode: '', status: 'active', createdAt: '' })
    sites.value.unshift(created)
    return created.id
  }

  async function updateSite(id: string, input: SiteInput) {
    const current = getSiteById(id)
    if (!current) throw new Error('Site introuvable.')
    const payload: UpdateSiteRequest = {}
    const name = input.name.trim()
    const address = input.address?.trim() || undefined
    const locationDescription = input.locationDescription?.trim() || undefined
    if (name !== current.name) payload.name = name
    if (address !== (current.address || undefined)) payload.address = address
    if (locationDescription !== (current.locationDescription || undefined)) payload.locationDescription = locationDescription
    if (input.managerId && input.managerId !== current.managerId) payload.responsibleId = input.managerId
    if (input.points?.length === 3) {
      const location = perimeterLocation(input.points)
      if (location.coordinates.join() !== [Number(current.longitude), Number(current.latitude)].join()) payload.location = location
    }
    const local = { ...current, city: input.city, points: input.points }
    const updated = Object.keys(payload).length ? mapSite(await siteService.update(id, payload), local) : local
    replaceSite(updated)
    return updated
  }

  async function archiveSite(id: string) {
    const updated = mapSite(await siteService.archive(id), getSiteById(id))
    replaceSite(updated)
    return updated
  }

  async function regenerateQrCode(id: string) {
    const result = await siteService.generateQrCode(id)
    const site = getSiteById(id)
    if (site) Object.assign(site, { qrImage: result.qrCode, qrRotatedAt: result.rotatedAt })
  }

  function importSites(count: number) {
    if (!mockMode) throw new Error("L’API ne fournit pas encore d’endpoint d’import de sites.")
    const now = Date.now()
    for (let index = 0; index < count; index += 1) {
      const id = `site-imported-${now}-${index}`
      sites.value.unshift({ id, name: `Site importé ${index + 1}`, qrCode: `KBA-${id.toUpperCase()}`, status: 'draft', createdAt: new Date().toISOString() })
    }
  }

  function replaceSite(site: Site) {
    const index = sites.value.findIndex((item) => item.id === site.id)
    if (index >= 0) sites.value[index] = site
    else sites.value.unshift(site)
  }

  async function createMission(input: MissionInput) {
    const payload: CreateMissionRequest = {
      code: input.code.trim(),
      name: input.title.trim(),
      description: input.notes?.trim() || undefined,
      startAt: toIso(input.startAt),
      endAt: toIso(input.endAt),
    }
    const created = mapMission(await missionService.create(payload))
    missions.value.unshift(created)
    return created.id
  }

  async function updateMission(id: string, input: MissionInput) {
    const current = getMissionById(id)
    if (!current) throw new Error('Mission introuvable.')
    const payload: UpdateMissionRequest = {}
    const code = input.code.trim()
    const name = input.title.trim()
    const description = input.notes?.trim() || undefined
    const startAt = toIso(input.startAt)
    const endAt = toIso(input.endAt)
    if (code !== current.code) payload.code = code
    if (name !== current.title) payload.name = name
    if (description !== (current.notes || undefined)) payload.description = description
    if (startAt !== current.startAt) payload.startAt = startAt
    if (endAt !== current.endAt) payload.endAt = endAt
    if (!Object.keys(payload).length) return current
    const updated = mapMission(await missionService.update(id, payload))
    replaceMission(updated)
    return updated
  }

  async function openMission(id: string) {
    const updated = mapMission(await missionService.open(id))
    replaceMission(updated)
    return updated
  }

  async function closeMission(id: string) {
    const updated = mapMission(await missionService.close(id))
    replaceMission(updated)
    return updated
  }

  function assignMissionSite(id: string, siteId: string) {
    const mission = getMissionById(id)
    if (!mission) throw new Error('Mission introuvable.')
    mission.siteId = siteId
    return mission
  }

  function replaceMission(mission: Mission) {
    const index = missions.value.findIndex((item) => item.id === mission.id)
    if (index >= 0) missions.value[index] = mission
    else missions.value.unshift(mission)
  }

  function resetData() {
    users.value = mockMode ? structuredClone(mockEnterpriseUsers) : []
    supervisors.value = []
    teams.value = mockMode ? structuredClone(mockTeams) : []
    sites.value = []
    missions.value = []
    userNextCursor.value = null
    teamNextCursor.value = null
    userCursorHistory.value = []
    teamCursorHistory.value = []
    userPage.value = 1
    teamPage.value = 1
    hasLoadedDirectory.value = false
    hasLoadedMissions.value = false
    hasLoadedSites.value = false
  }

  return {
    users, supervisors, teamDirectoryUsers, sites, missions, teams, isDirectoryLoading, hasLoadedDirectory, isMissionsLoading, hasLoadedMissions, isSitesLoading, hasLoadedSites, canReactivateUsers, canImportUsers, canImportSites,
    userNextCursor, userCursorHistory, userPage, teamNextCursor, teamCursorHistory, teamPage,
    activeUsersCount, pendingDeviceActivationsCount, activeSitesCount, ongoingMissionsCount,
    getUserById, getSiteById, getMissionById, getTeamById, loadDirectory, loadMissions, loadMission, loadSites, loadSite,
    nextUserPage, previousUserPage, nextTeamPage, previousTeamPage,
    createUser, updateUser, toggleUserStatus, importUsers,
    createSite, updateSite, archiveSite, importSites, regenerateQrCode,
    createMission, updateMission, openMission, closeMission, assignMissionSite,
    createTeam, updateTeam, deleteTeam, loadTeamAgentDirectory, addTeamMembers, removeTeamMembers,
    resetData,
  }
})
