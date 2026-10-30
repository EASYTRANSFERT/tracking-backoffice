import { ref } from 'vue'
import { defineStore } from 'pinia'

import { missionService } from '@/Services/mission.service'
import type { MissionOverviewQuery, MissionOverviewResponse } from '@/types/mission'

/** Vue d'ensemble d'une mission (administrateur et superviseur) : une seule mission consultée à la fois. */
export const useMissionOverviewStore = defineStore('mission-overview', () => {
  const overview = ref<MissionOverviewResponse | null>(null)
  const isLoading = ref(false)

  async function load(missionId: string, query: MissionOverviewQuery) {
    isLoading.value = true
    overview.value = null
    try {
      overview.value = await missionService.overview(missionId, query)
    } finally {
      isLoading.value = false
    }
  }

  function resetData() {
    overview.value = null
  }

  return { overview, isLoading, load, resetData }
})
