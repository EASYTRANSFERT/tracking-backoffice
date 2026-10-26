import { fullName, byName, isTeamMember } from '@/utils/people'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { teamService } from '@/Services/team.service'
import { userService } from '@/Services/user.service'
import { missionService } from '@/Services/mission.service'
import { siteService } from '@/Services/site.service'
import { mapMission, mapSite, mapTeam, mapUser, roleToApi, toArea } from '@/stores/mappers'
import { mockEnterpriseUsers, mockTeams } from '@/mocks/administrator-data'
import { readRejectedImportReport } from '@/utils/matricule-import'
import type { EnterpriseUser, EnterpriseUserInput, Mission, MissionInput, Site, SiteInput, SitePoint, Team, TeamInput } from '@/types/administrator'
import type { CreateMissionRequest, MissionResponse, UpdateMissionRequest } from '@/types/mission'
import type { CreateSiteRequest, SiteCoordinate, SiteResponse, UpdateSiteRequest } from '@/types/site'
import type { TeamResponse } from '@/types/team'
import type { MatriculeImportReport } from '@/types/user'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const PAGE_SIZE = 10
const sameArea = (a: SiteCoordinate[], b: SiteCoordinate[]) => JSON.stringify(toArea(a)) === JSON.stringify(toArea(b))

function toIso(value?: string) {
  return value ? new Date(value).toISOString() : undefined
}

export const useAdministratorStore = defineStore('administrator', () => {
  const users = ref<EnterpriseUser[]>(mockMode ? structuredClone(mockEnterpriseUsers) : [])
  const supervisors = ref<EnterpriseUser[]>([])
  const teamLeadOptions = ref<EnterpriseUser[]>([])
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

  const activeUsersCount = computed(() => users.value.filter(
    (user) => user.role !== 'administrator' && user.status === 'active',
  ).length)
  const activeSitesCount = computed(() => sites.value.filter((site) => site.status === 'active').length)
  const ongoingMissionsCount = computed(() => missions.value.filter((mission) => mission.status === 'ongoing').length)
  /** Nombre de membres (agents et chef d'équipe) par équipe. */
  const teamMemberCounts = ref<Record<string, number>>({})
  /** Comptes chargés un par un pour afficher un nom (responsable, chef, superviseur…). */
  const knownUsers = ref<EnterpriseUser[]>([])
  const teamDirectoryUsers = computed(() => [
    ...new Map([...users.value, ...supervisors.value, ...teamLeadOptions.value, ...knownUsers.value].map((user) => [user.id, user])).values(),
  ])
  const findUser = (id?: string | null) => id ? teamDirectoryUsers.value.find((user) => user.id === id) : undefined

  /**
   * Charge les comptes absents des listes déjà chargées (la liste des utilisateurs est paginée) :
   * sans cela, un responsable ou un chef d'équipe hors de la première page s'affiche « Non affecté ».
   */
  async function ensureUsers(ids: (string | null | undefined)[]) {
    const missing = [...new Set(ids.filter((id): id is string => Boolean(id)))].filter((id) => !findUser(id))
    if (!missing.length) return
    const found = await Promise.all(missing.map((id) => userService.findOne(id).then(mapUser).catch(() => null)))
    knownUsers.value = [...knownUsers.value, ...found.filter((user): user is EnterpriseUser => user !== null)]
  }

  /** Nombre de membres (agents et chef d'équipe) de chaque équipe demandée. */
  async function loadTeamMemberCounts(teamIds: (string | null | undefined)[]) {
    const unique = [...new Set(teamIds.filter((id): id is string => Boolean(id)))]
    const counts = await Promise.all(unique.map(async (teamId) => {
      const members = (await userService.list({ teamId, limit: 200 })).items.map(mapUser)
      return [teamId, members.filter((user) => isTeamMember(user)).length] as const
    }))
    teamMemberCounts.value = { ...teamMemberCounts.value, ...Object.fromEntries(counts) }
  }

  const getUserById = (id: string) => users.value.find((user) => user.id === id)
  const getSiteById = (id: string) => sites.value.find((site) => site.id === id)
  const getMissionById = (id: string) => missions.value.find((mission) => mission.id === id)
  const teamOptions = ref<Team[]>([])
  const getTeamById = (id: string) => teams.value.find((team) => team.id === id)
  /** Équipes connues : la page affichée et la liste complète des choix (teamOptions). */
  const knownTeams = computed(() => [...new Map([...teams.value, ...teamOptions.value].map((team) => [team.id, team])).values()])
  const findTeam = (id?: string | null) => id ? knownTeams.value.find((team) => team.id === id) : undefined
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
    const created = await userService.create({
      names: fullName(input),
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
      names: fullName(input),
      email: input.email || undefined,
      phone: input.phone,
      role: roleToApi[input.role],
      teamId: input.teamId,
    })))
  }

  async function toggleUserStatus(id: string) {
    const user = findUser(id)
    if (!user) return
    if (user.status === 'disabled') throw new Error("L’API ne fournit pas d’endpoint de réactivation utilisateur.")
    replaceUser(mapUser(await userService.disable(id)))
  }

  function replaceUser(user: EnterpriseUser) {
    const index = users.value.findIndex((item) => item.id === user.id)
    if (index >= 0) users.value[index] = user
    else users.value.unshift(user)
    // Un compte chargé à part (hors de la page affichée) doit aussi refléter la modification.
    knownUsers.value = knownUsers.value.map((item) => item.id === user.id ? user : item)
  }

  /**
   * Import des matricules : simulation (dryRun) puis application. Un fichier refusé
   * (422) renvoie quand même son rapport ligne par ligne, pour l'afficher.
   */
  async function importMatricules(file: File, dryRun: boolean): Promise<MatriculeImportReport> {
    try {
      const report = await userService.importMatricules(file, dryRun)
      if (report.applied) await loadDirectory(true)
      return report
    } catch (error) {
      const report = readRejectedImportReport(error)
      if (report) return report
      throw error
    }
  }


  async function createTeam(input: TeamInput) {
    const created = await teamService.create({
      name: input.name,
      leadUserId: input.leadUserId,
    })
    teams.value.unshift(mapTeam(created))
    return created.id
  }

  /** Chefs d'équipe proposés à la création d'une équipe : comptes TEAM_LEAD actifs. */
  async function loadTeamLeadOptions() {
    const page = await userService.list({ role: 'TEAM_LEAD', status: 'ACTIVE', limit: 200 })
    teamLeadOptions.value = page.items.map(mapUser)
      .sort(byName)
    return teamLeadOptions.value
  }

  async function updateTeam(id: string, input: TeamInput) {
    const current = findTeam(id)
    if (!current) throw new Error('Équipe introuvable.')
    let updated = current
    if (input.name.trim() !== current.name) {
      updated = mapTeam(await teamService.update(id, { name: input.name.trim() }))
    }
    // Le chef d'équipe ne change pas ici : PUT /teams/{id}/lead exige une ré-authentification TOTP.
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
      members: directory.filter((user) => user.teamId === teamId && isTeamMember(user)),
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
    teamOptions.value = teamOptions.value.map((item) => item.id === team.id ? team : item)
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

  const getMissionSites = (missionId: string) => sites.value.filter((site) => site.missionId === missionId)
  /** Sites actifs sans mission, qu'on peut rattacher depuis la page d'une mission. */
  const sitesWithoutMission = computed(() => sites.value.filter((site) => !site.missionId && site.status !== 'inactive'))

  async function attachSitesToMission(missionId: string, siteIds: string[]) {
    // Une requête par site ; ceux déjà rattachés restent rattachés si une requête suivante échoue.
    for (const siteId of siteIds) {
      const current = getSiteById(siteId)
      replaceSite(mapSite(await siteService.update(siteId, { missionId }), current))
    }
  }

  // Une mission peut avoir plusieurs sites : c'est le site qui porte sa mission (missionId).
  async function loadMissionSites(missionId: string) {
    const loaded = (await siteService.list({ missionId, limit: 200 })).items.map((site) => mapSite(site, getSiteById(site.id)))
    const loadedIds = new Set(loaded.map((site) => site.id))
    sites.value = [...sites.value.filter((site) => !loadedIds.has(site.id)), ...loaded]

    await Promise.all([
      loadTeamMemberCounts(loaded.map((site) => site.teamId)),
      ensureUsers(loaded.map((site) => site.managerId)),
    ])
    return loaded
  }

  async function loadSite(id: string) {
    const cached = getSiteById(id)
    if (cached) return cached
    const site = mapSite(await siteService.findOne(id))
    replaceSite(site)
    return site
  }

  /** Toutes les équipes (200 au plus), pour les listes de choix. */
  async function loadTeamOptions() {
    teamOptions.value = (await teamService.list({ limit: 200 })).items.map(mapTeam)
    return teamOptions.value
  }

  async function loadTeam(id: string) {
    const cached = getTeamById(id) ?? teamOptions.value.find((team) => team.id === id)
    if (cached) return cached
    const team = mapTeam(await teamService.findOne(id))
    teamOptions.value = [...teamOptions.value, team]
    return team
  }

  async function createSite(input: SiteInput) {
    if (!input.managerId || !input.points || input.points.length < 3) throw new Error('Superviseur et périmètre sont obligatoires.')
    const payload: CreateSiteRequest = {
      name: input.name.trim(),
      address: input.address?.trim() || undefined,
      locationDescription: input.locationDescription?.trim() || undefined,
      area: toArea(input.points),
      responsibleId: input.managerId,
      missionId: input.missionId || undefined,
      teamId: input.teamId || undefined,
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
    // L'API ne permet pas de retirer l'équipe d'un site, seulement d'en désigner une autre.
    if (input.teamId && input.teamId !== current.teamId) payload.teamId = input.teamId
    // Une mission peut être donnée à un site qui n'en a pas ; elle ne se change plus ensuite.
    if (input.missionId && !current.missionId) payload.missionId = input.missionId
    if (input.points && input.points.length >= 3 && !sameArea(input.points, current.points ?? [])) payload.area = toArea(input.points)
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
      supervisorUserId: input.supervisorUserId,
      description: input.notes?.trim() || undefined,
      startAt: toIso(input.startAt),
      endAt: toIso(input.endAt),
    }
    const response = mapMission(await missionService.create(payload))
    const created = { ...response, supervisorUserId: response.supervisorUserId ?? input.supervisorUserId }
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
    let updated = current
    if (Object.keys(payload).length) updated = mapMission(await missionService.update(id, payload))
    if (input.supervisorUserId && input.supervisorUserId !== current.supervisorUserId) {
      updated = await assignMissionSupervisor(id, input.supervisorUserId)
    }
    replaceMission(updated)
    return updated
  }

  async function assignMissionSupervisor(id: string, supervisorUserId: string) {
    const updated = mapMission(await missionService.assignSupervisor(id, { userId: supervisorUserId }))
    // Si l'API ne renvoie pas encore le superviseur, on garde celui qui vient d'être attribué.
    const withSupervisor = { ...updated, supervisorUserId: updated.supervisorUserId ?? supervisorUserId }
    replaceMission(withSupervisor)
    return withSupervisor
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

  function replaceMission(mission: Mission) {
    const index = missions.value.findIndex((item) => item.id === mission.id)
    if (index >= 0) missions.value[index] = mission
    else missions.value.unshift(mission)
  }

  function resetData() {
    users.value = mockMode ? structuredClone(mockEnterpriseUsers) : []
    supervisors.value = []
    teamLeadOptions.value = []
    knownUsers.value = []
    teamMemberCounts.value = {}
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
    users, supervisors, teamDirectoryUsers, sites, missions, teams, isDirectoryLoading, hasLoadedDirectory, isMissionsLoading, hasLoadedMissions, isSitesLoading, hasLoadedSites, canReactivateUsers, canImportSites,
    userNextCursor, userCursorHistory, userPage, teamNextCursor, teamCursorHistory, teamPage,
    activeUsersCount, activeSitesCount, ongoingMissionsCount,
    getUserById, getSiteById, getMissionById, getTeamById, loadDirectory, loadMissions, loadMission, loadSites, loadSite,
    nextUserPage, previousUserPage, nextTeamPage, previousTeamPage,
    createUser, updateUser, toggleUserStatus, importMatricules,
    createSite, updateSite, archiveSite, importSites, regenerateQrCode,
    teamOptions, loadTeamOptions, loadTeam,
    createMission, updateMission, assignMissionSupervisor, openMission, closeMission,
    teamMemberCounts, loadTeamMemberCounts, findUser, ensureUsers, knownTeams, findTeam, getMissionSites, loadMissionSites, sitesWithoutMission, attachSitesToMission,
    teamLeadOptions, loadTeamLeadOptions, createTeam, updateTeam, deleteTeam, loadTeamAgentDirectory, addTeamMembers, removeTeamMembers,
    resetData,
  }
})
