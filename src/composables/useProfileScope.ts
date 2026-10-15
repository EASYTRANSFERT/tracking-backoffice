import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuthStore } from '@/stores/auth.store'

export function useProfileScope() {
  const authStore = useAuthStore()
  const administratorStore = useAdministratorStore()
  const { activeRole, currentUser } = storeToRefs(authStore)
  const { missions, teams } = storeToRefs(administratorStore)

  const supervisedTeams = computed(() => {
    if (activeRole.value !== 'supervisor' || !currentUser.value) return []
    return teams.value.filter((team) => team.supervisorUserId === currentUser.value?.id)
  })

  const scopedMissions = computed(() => {
    if (!currentUser.value) return []

    const missionsWithScope = missions.value.filter(
      (mission) => mission.supervisorId || mission.teamId,
    )

    // In production, GET /missions is already restricted by the authenticated
    // tenant and role. The explicit filter is only needed when scope metadata is
    // present (notably in the local mock fixtures).
    if (!missionsWithScope.length) return missions.value

    if (activeRole.value === 'supervisor') {
      const teamIds = new Set(supervisedTeams.value.map((team) => team.id))
      return missions.value.filter((mission) =>
        mission.supervisorId === currentUser.value?.id ||
        Boolean(mission.teamId && teamIds.has(mission.teamId)),
      )
    }

    if (activeRole.value === 'teamLeader') {
      return missions.value.filter((mission) =>
        mission.teamId === currentUser.value?.teamId,
      )
    }

    return missions.value
  })

  const missionDetailsRoute = computed(() =>
    activeRole.value === 'supervisor'
      ? 'supervisor-mission-details'
      : 'team-leader-mission-details',
  )

  const missionsRoute = computed(() =>
    activeRole.value === 'supervisor'
      ? 'supervisor-missions'
      : 'team-leader-missions',
  )

  return {
    activeRole,
    currentUser,
    supervisedTeams,
    scopedMissions,
    missionDetailsRoute,
    missionsRoute,
  }
}
