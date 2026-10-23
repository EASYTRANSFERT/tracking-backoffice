<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Mission } from '@/types/administrator'

const router = useRouter()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { missions, isMissionsLoading } = storeToRefs(store)
const view = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
const edit = (mission: Mission) => router.push({ name: 'admin-mission-edit', params: { missionId: mission.id } })

async function open(mission: Mission) {
  const confirmed = await feedback.askConfirmation({ title: 'Ouvrir cette mission ?', message: `La mission « ${mission.title} » passera au statut en cours.`, confirmText: 'Ouvrir' })
  if (!confirmed) return
  try { await store.openMission(mission.id); feedback.success('Mission ouverte.') }
  catch (error) { feedback.error(getApiErrorMessage(error, "Impossible d’ouvrir la mission.")) }
}
async function close(mission: Mission) {
  const confirmed = await feedback.askConfirmation({ title: 'Clôturer cette mission ?', message: `La mission « ${mission.title} » sera marquée comme terminée.`, confirmText: 'Clôturer' })
  if (!confirmed) return
  try { await store.closeMission(mission.id); feedback.success('Mission clôturée.') }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de clôturer la mission.')) }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader><template #title>Missions</template><template #description>Planifiez les interventions et suivez leur cycle de vie.</template><template #actions><v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn></template></PageHeader>
    <MissionTable :missions="missions" :loading="isMissionsLoading" @view="view" @edit="edit" @open="open" @close="close" />
  </div>
</template>
