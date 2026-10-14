import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { teamService } from '@/Services/team.service'
import { userService } from '@/Services/user.service'
import { mockEnterpriseUsers, mockMissions, mockSites, mockTeams } from '@/mocks/administrator-data'
import type { EnterpriseUser, EnterpriseUserInput, MissionInput, SiteInput, Team, TeamInput } from '@/types/administrator'
import type { TeamResponse } from '@/types/team'
import type { ApiUserRole, UserResponse } from '@/types/user'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const PAGE_SIZE = 10
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
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }
}

export const useAdministratorStore = defineStore('administrator', () => {
  const users = ref<EnterpriseUser[]>(mockMode ? structuredClone(mockEnterpriseUsers) : [])
  const teams = ref<Team[]>(mockMode ? structuredClone(mockTeams) : [])
  const sites = ref(structuredClone(mockSites))
  const missions = ref(structuredClone(mockMissions))
  const isDirectoryLoading = ref(false)
  const hasLoadedDirectory = ref(false)
  const canReactivateUsers = computed(() => mockMode)
  const canImportUsers = computed(() => mockMode)

  const activeUsersCount = computed(() => users.value.filter((user) => user.status === 'active').length)
  const pendingDeviceActivationsCount = computed(() => users.value.filter((user) => user.status === 'invited').length)
  const activeSitesCount = computed(() => sites.value.filter((site) => site.status === 'active').length)
  const ongoingMissionsCount = computed(() => missions.value.filter((mission) => mission.status === 'ongoing').length)

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
      const [userPage, teamPage] = await Promise.all([
        userService.list({ limit: PAGE_SIZE }),
        teamService.list({ limit: PAGE_SIZE }),
      ])
      users.value = userPage.items.map(mapUser)
      teams.value = teamPage.items.map(mapTeam)
      userNextCursor.value = userPage.nextCursor ?? null
      teamNextCursor.value = teamPage.nextCursor ?? null
      userCursorHistory.value = []
      teamCursorHistory.value = []
      hasLoadedDirectory.value = true
    } finally {
      isDirectoryLoading.value = false
    }
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
    const created = await teamService.create({ name: input.name })
    teams.value.unshift(mapTeam(created))
    return created.id
  }

  async function updateTeam(id: string, input: TeamInput) {
    replaceTeam(mapTeam(await teamService.update(id, { name: input.name })))
  }

  async function deleteTeam(id: string): Promise<boolean> {
    await teamService.remove(id)
    teams.value = teams.value.filter((team) => team.id !== id)
    return true
  }

  function replaceTeam(team: Team) {
    const index = teams.value.findIndex((item) => item.id === team.id)
    if (index >= 0) teams.value[index] = team
    else teams.value.unshift(team)
  }

  function createSite(input: SiteInput) { const id = `site-${Date.now()}`; const isComplete = Boolean(input.address && input.city && input.managerId); sites.value.unshift({ ...input, id, qrCode: `KBA-${id.toUpperCase()}`, status: isComplete ? 'active' : 'draft', createdAt: new Date().toISOString() }); return id }
  function updateSite(id: string, input: SiteInput) { const site = getSiteById(id); if (site) Object.assign(site, input) }
  function importSites(count: number) { const now = Date.now(); for (let index = 0; index < count; index += 1) { const id = `site-imported-${now}-${index}`; sites.value.unshift({ id, name: `Site importé ${index + 1}`, qrCode: `KBA-${id.toUpperCase()}`, status: 'draft', createdAt: new Date().toISOString() }) } }
  function toggleSiteStatus(id: string) { const site = getSiteById(id); if (site) site.status = site.status === 'active' ? 'inactive' : 'active' }
  function regenerateQrCode(id: string) { const site = getSiteById(id); if (site) site.qrCode = `KBA-${id.toUpperCase()}-${Date.now()}` }
  function createMission(input: MissionInput) { const id = `mission-${Date.now()}`; missions.value.unshift({ ...input, id, status: 'scheduled' }); return id }
  function updateMission(id: string, input: MissionInput) { const mission = getMissionById(id); if (mission) Object.assign(mission, input) }
  function cancelMission(id: string) { const mission = getMissionById(id); if (mission) mission.status = 'cancelled' }

  function resetData() {
    users.value = mockMode ? structuredClone(mockEnterpriseUsers) : []
    teams.value = mockMode ? structuredClone(mockTeams) : []
    sites.value = structuredClone(mockSites)
    missions.value = structuredClone(mockMissions)
    userNextCursor.value = null
    teamNextCursor.value = null
    userCursorHistory.value = []
    teamCursorHistory.value = []
    userPage.value = 1
    teamPage.value = 1
    hasLoadedDirectory.value = false
  }

  return {
    users, sites, missions, teams, isDirectoryLoading, hasLoadedDirectory, canReactivateUsers, canImportUsers,
    userNextCursor, userCursorHistory, userPage, teamNextCursor, teamCursorHistory, teamPage,
    activeUsersCount, pendingDeviceActivationsCount, activeSitesCount, ongoingMissionsCount,
    getUserById, getSiteById, getMissionById, getTeamById, loadDirectory,
    nextUserPage, previousUserPage, nextTeamPage, previousTeamPage,
    createUser, updateUser, toggleUserStatus, importUsers,
    createSite, updateSite, importSites, toggleSiteStatus, regenerateQrCode,
    createMission, updateMission, cancelMission,
    createTeam, updateTeam, deleteTeam,
    resetData,
  }
})
