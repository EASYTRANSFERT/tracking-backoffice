<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Mission } from '@/types/administrator'

const router = useRouter()
const store = useSupervisorStore()
const feedback = useUiFeedbackStore()
const { missions, isLoading } = storeToRefs(store)

onMounted(async () => {
  try { await store.loadScope(true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger vos missions.')) }
})

const viewMission = (mission: Mission) => router.push({ name: 'supervisor-mission-details', params: { missionId: mission.id } })
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Mes missions</template>
      <template #description>Missions qui vous sont attribuées.</template>
      <template #actions><span /></template>
    </PageHeader>
    <MissionTable :missions="missions" :loading="isLoading" title="Missions de mon périmètre" description="Cliquez sur une mission pour voir ses sites, ses équipes et ses agents." :show-actions="false" row-clickable @view="viewMission" />
  </div>
</template>
