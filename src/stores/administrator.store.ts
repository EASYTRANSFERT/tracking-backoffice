import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { teamService } from '@/Services/team.service'
import { userService } from '@/Services/user.service'
import { mockEnterpriseUsers, mockMissions, mockSites, mockTeams } from '@/mocks/administrator-data'
import type { EnterpriseUser, EnterpriseUserInput, MissionInput, SiteInput, Team, TeamInput } from '@/types/administrator'
import type { TeamResponse } from '@/types/team'
import type { ApiUserRole, UserResponse } from '@/types/user'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
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
  const hasLoadedDirectory = ref(mockMode)
  const canReactivateUsers = computed(() => mockMode)
  const canImportUsers = computed(() => mockMode)

  const activeUsersCount = computed(() => users.value.filter((user) => user.status === 'active').length)
  const pendingDeviceActivationsCount = ref(3)
  const activeSitesCount = computed(() => sites.value.filter((site) => site.status === 'active').length)
  const ongoingMissionsCount = computed(() => missions.value.filter((mission) => mission.status === 'ongoing').length)

  const getUserById = (id: string) => users.value.find((user) => user.id === id)
  const getSiteById = (id: string) => sites.value.find((site) => site.id === id)
  const getMissionById = (id: string) => missions.value.find((mission) => mission.id === id)
  const getTeamById = (id: string) => teams.value.find((team) => team.id === id)

  async function loadDirectory(force = false) {
    if (mockMode || (hasLoadedDirectory.value && !force)) return
    isDirectoryLoading.value = true
    try {
      const [userPage, teamPage] = await Promise.all([
        userService.list({ limit: 200 }),
        teamService.list({ limit: 200 }),
      ])
      users.value = userPage.items.map(mapUser)
      teams.value = teamPage.items.map(mapTeam)
      hasLoadedDirectory.value = true
    } finally {
      isDirectoryLoading.value = false
    }
  }

  async function createUser(input: EnterpriseUserInput) {
    if (mockMode) {
      const id = `user-${Date.now()}`
      users.value.unshift({ ...input, id, status: 'invited', createdAt: new Date().toISOString() })
      return id
    }
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
    if (mockMode) {
      const user = getUserById(id)
      if (user) Object.assign(user, input)
      return
    }
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
    if (mockMode) {
      user.status = user.status === 'disabled' ? 'active' : 'disabled'
      return
    }
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
    if (mockMode) {
      const id = `team-${Date.now()}`
      const now = new Date().toISOString()
      teams.value.unshift({ ...input, id, createdAt: now, updatedAt: now })
      return id
    }
    const created = await teamService.create({ name: input.name })
    teams.value.unshift(mapTeam(created))
    return created.id
  }

  async function updateTeam(id: string, input: TeamInput) {
    if (mockMode) {
      const team = getTeamById(id)
      if (team) Object.assign(team, input, { updatedAt: new Date().toISOString() })
      return
    }
    replaceTeam(mapTeam(await teamService.update(id, { name: input.name })))
  }

  async function deleteTeam(id: string): Promise<boolean> {
    if (mockMode) {
      if (users.value.some((user) => user.teamId === id) || missions.value.some((mission) => mission.teamId === id)) return false
    } else {
      await teamService.remove(id)
    }
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

  return {
    users, sites, missions, teams, isDirectoryLoading, hasLoadedDirectory, canReactivateUsers, canImportUsers,
    activeUsersCount, pendingDeviceActivationsCount, activeSitesCount, ongoingMissionsCount,
    getUserById, getSiteById, getMissionById, getTeamById, loadDirectory,
    createUser, updateUser, toggleUserStatus, importUsers,
    createSite, updateSite, importSites, toggleSiteStatus, regenerateQrCode,
    createMission, updateMission, cancelMission,
    createTeam, updateTeam, deleteTeam,
  }
})
