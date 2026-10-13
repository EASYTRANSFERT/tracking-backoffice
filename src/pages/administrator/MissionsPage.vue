<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Mission } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { missions, sites, users, teams } = storeToRefs(store)
const view = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
const edit = (mission: Mission) => router.push({ name: 'admin-mission-edit', params: { missionId: mission.id } })
async function cancel(mission: Mission) { const confirmed = await feedback.askConfirmation({ title: 'Annuler cette mission ?', message: `La mission « ${mission.title} » passera au statut annulé.`, confirmText: 'Annuler la mission', color: 'error' }); if (!confirmed) return; store.cancelMission(mission.id); feedback.success('Mission annulée.') }
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Missions</template><template #description>Planifiez les interventions et affectez les équipes aux sites.</template><template #actions><v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn></template></PageHeader><MissionTable :missions="missions" :sites="sites" :users="users" :teams="teams" @view="view" @edit="edit" @cancel="cancel" /></div></template>
