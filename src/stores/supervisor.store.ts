import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { missionService } from '@/Services/mission.service'
import { siteService } from '@/Services/site.service'
import { teamService } from '@/Services/team.service'
import { mapMission, mapSite, mapTeam } from '@/stores/mappers'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'

import type { EnterpriseUser, Mission, Site, Team } from '@/types/administrator'

/**
 * Périmètre du superviseur, en lecture seule.
 * Ses missions : celles qui lui sont attribuées (mission.supervisorUserId).
 * Ses sites : ceux que GET /sites lui renvoie (l'API le borne à son périmètre) ;
 * dans une mission, il ne voit que ceux-là.
 */
export const useSupervisorStore = defineStore('supervisor', () => {
  const authStore = useAuthStore()

  const sites = ref<Site[]>([])
  const missions = ref<Mission[]>([])
  const teamsById = ref<Record<string, Team>>({})
  /** Agents et chef de l'équipe du site affiché. */
  const members = ref<EnterpriseUser[]>([])
  const isMembersLoading = ref(false)
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  const getMissionById = (id: string) => missions.value.find((mission) => mission.id === id)
  const getMissionSites = (missionId: string) => sites.value
    .filter((site) => site.missionId === missionId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  /** Équipes qui travaillent sur les sites du superviseur. */
  const teamCount = computed(() => new Set(sites.value.map((site) => site.teamId).filter(Boolean)).size)
  const siteCountByMission = computed(() => sites.value.reduce<Record<string, number>>((counts, site) => {
    if (site.missionId) counts[site.missionId] = (counts[site.missionId] ?? 0) + 1
    return counts
  }, {}))

  async function loadScope(force = false) {
    if (hasLoaded.value && !force) return
    const userId = authStore.currentUser?.id
    if (!userId) return

    isLoading.value = true
    try {
      const [allMissions, visibleSites] = await Promise.all([listAllMissions(), siteService.list({ limit: 200 })])
      sites.value = visibleSites.items.map((site) => mapSite(site))

      // Tant que l'API ne renvoie pas supervisorUserId (absent du Swagger au 23/10), on retombe
      // sur les missions de ses sites, pour que la page ne reste pas vide.
      const apiReturnsSupervisor = allMissions.some((mission) => mission.supervisorUserId)
      const siteMissionIds = new Set(sites.value.map((site) => site.missionId))
      missions.value = allMissions
        .filter((mission) => apiReturnsSupervisor ? mission.supervisorUserId === userId : siteMissionIds.has(mission.id))
        .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''))
      hasLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function listAllMissions(): Promise<Mission[]> {
    const items: Mission[] = []
    let cursor: string | undefined
    do {
      const page = await missionService.list({ cursor, limit: 200 })
      items.push(...page.items.map(mapMission))
      cursor = page.nextCursor ?? undefined
    } while (cursor)
    return items
  }

  /** Équipe de chaque site de la mission. Ses agents sont chargés par le planning (assignment.store). */
  async function loadMissionTeams(missionId: string) {
    const teamIds = [...new Set(getMissionSites(missionId).map((site) => site.teamId).filter((id): id is string => Boolean(id)))]
    const missing = teamIds.filter((teamId) => !teamsById.value[teamId])
    const teams = await Promise.all(missing.map((teamId) => teamService.findOne(teamId).then(mapTeam)))
    teamsById.value = { ...teamsById.value, ...Object.fromEntries(teams.map((team) => [team.id, team])) }
  }

  let membersTeamId: string | undefined
  async function loadTeamMembers(teamId?: string) {
    membersTeamId = teamId
    members.value = []
    if (!teamId) return
    isMembersLoading.value = true
    try {
      const loaded = await useAdministratorStore().listTeamMembers(teamId)
      // Ignore une réponse arrivée après un changement de site.
      if (membersTeamId === teamId) members.value = loaded
    } finally {
      isMembersLoading.value = false
    }
  }

  function reset() {
    sites.value = []
    members.value = []
    missions.value = []
    teamsById.value = {}
    hasLoaded.value = false
  }

  return {
    sites, missions, teamCount, teamsById, isLoading, hasLoaded,
    siteCountByMission, getMissionById, getMissionSites, loadScope, loadMissionTeams, members, isMembersLoading, loadTeamMembers, reset,
  }
})
