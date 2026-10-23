import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { missionService } from '@/Services/mission.service'
import { siteService } from '@/Services/site.service'
import { teamService } from '@/Services/team.service'
import { userService } from '@/Services/user.service'
import { mapMission, mapSite, mapTeam, mapUser } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'

import type { EnterpriseUser, Mission, Site, Team } from '@/types/administrator'

const byName = (a: EnterpriseUser, b: EnterpriseUser) =>
  `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')

/**
 * Périmètre du superviseur, en lecture seule : les sites dont il est responsable
 * (GET /sites est borné à ce périmètre par l'API), leurs missions, et les équipes
 * qui travaillent sur ces sites. Dans une mission, il ne voit que ses sites.
 */
export const useSupervisorStore = defineStore('supervisor', () => {
  const authStore = useAuthStore()

  const sites = ref<Site[]>([])
  const missions = ref<Mission[]>([])
  const teamsById = ref<Record<string, Team>>({})
  const membersByTeam = ref<Record<string, EnterpriseUser[]>>({})
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
      const managed = await siteService.list({ managerId: userId, limit: 200 })
      const unique = new Map(managed.items.map((site) => [site.id, mapSite(site)]))

      const missionIds = [...new Set([...unique.values()].map((site) => site.missionId).filter((id): id is string => Boolean(id)))]
      const loadedMissions = await Promise.all(missionIds.map((id) => missionService.findOne(id).then(mapMission).catch(() => null)))

      sites.value = [...unique.values()]
      missions.value = loadedMissions
        .filter((mission): mission is Mission => mission !== null)
        .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''))
      hasLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  /** Équipe et agents de chaque site de la mission. */
  async function loadMissionTeams(missionId: string) {
    const teamIds = [...new Set(getMissionSites(missionId).map((site) => site.teamId).filter((id): id is string => Boolean(id)))]
    await Promise.all(teamIds.map(async (teamId) => {
      const [team, members] = await Promise.all([
        teamsById.value[teamId] ? Promise.resolve(teamsById.value[teamId]) : teamService.findOne(teamId).then(mapTeam),
        userService.list({ teamId, limit: 200 }).then((page) => page.items.map(mapUser)
          .filter((user) => ['agent', 'teamLeader'].includes(user.role))
          .sort(byName)),
      ])
      teamsById.value = { ...teamsById.value, [teamId]: team }
      membersByTeam.value = { ...membersByTeam.value, [teamId]: members }
    }))
  }

  function reset() {
    sites.value = []
    missions.value = []
    teamsById.value = {}
    membersByTeam.value = {}
    hasLoaded.value = false
  }

  return {
    sites, missions, teamCount, teamsById, membersByTeam, isLoading, hasLoaded,
    siteCountByMission, getMissionById, getMissionSites, loadScope, loadMissionTeams, reset,
  }
})
