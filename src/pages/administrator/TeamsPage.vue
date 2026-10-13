<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamTable from '@/Components/teams/TeamTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Team } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { teams, users } = storeToRefs(store)
async function remove(team: Team) { const confirmed = await feedback.askConfirmation({ title: 'Supprimer cette équipe ?', message: `L’équipe « ${team.name} » sera supprimée si elle ne possède ni membre ni mission.`, confirmText: 'Supprimer', color: 'error' }); if (!confirmed) return; try { if (await store.deleteTeam(team.id)) feedback.success('Équipe supprimée.'); else feedback.error('Cette équipe est encore utilisée et ne peut pas être supprimée.') } catch { feedback.error('Cette équipe est encore utilisée et ne peut pas être supprimée.') } }
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Équipes</template><template #description>Structurez les équipes avant de les affecter aux missions.</template><template #actions><v-btn color="primary" prepend-icon="mdi-account-multiple-plus-outline" :to="{ name: 'admin-team-create' }">Nouvelle équipe</v-btn></template></PageHeader><TeamTable :teams="teams" :users="users" @edit="router.push({ name: 'admin-team-edit', params: { teamId: $event.id } })" @remove="remove" /></div></template>
