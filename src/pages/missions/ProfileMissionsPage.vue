<script setup lang="ts">
import { useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { useProfileScope } from '@/composables/useProfileScope'
import type { Mission } from '@/types/administrator'

const router = useRouter()
const { scopedMissions, missionDetailsRoute } = useProfileScope()

function viewMission(mission: Mission) {
  void router.push({
    name: missionDetailsRoute.value,
    params: { missionId: mission.id },
  })
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Mes missions</template>
      <template #description>Consultez les missions comprises dans votre périmètre.</template>
      <template #actions><v-chip color="secondary" variant="tonal" prepend-icon="mdi-eye-outline">Lecture seule</v-chip></template>
    </PageHeader>

    <MissionTable
      :missions="scopedMissions"
      title="Missions affectées"
      description="Utilisez les filtres puis ouvrez une mission pour afficher ses détails."
      :show-actions="false"
      row-clickable
      @view="viewMission"
    />
  </div>
</template>
