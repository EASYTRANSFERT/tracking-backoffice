<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamMembersDialog from '@/Components/teams/TeamMembersDialog.vue'
import TeamTable from '@/Components/teams/TeamTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { EnterpriseUser, Team } from '@/types/administrator'

const router = useRouter()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { teams, teamDirectoryUsers, teamPage, teamNextCursor, teamCursorHistory } = storeToRefs(store)

const membersDialog = ref(false)
const selectedTeam = ref<Team>()
const teamMembers = ref<EnterpriseUser[]>([])
const availableAgents = ref<EnterpriseUser[]>([])
const selectedAgentIds = ref<string[]>([])
const loadingMembers = ref(false)
const savingMembers = ref(false)

async function remove(team: Team) {
  const confirmed = await feedback.askConfirmation({ title: 'Supprimer cette équipe ?', message: `L’équipe « ${team.name} » sera supprimée si elle ne possède ni membre ni mission.`, confirmText: 'Supprimer', color: 'error' })
  if (!confirmed) return
  try {
    if (await store.deleteTeam(team.id)) feedback.success('Équipe supprimée.')
    else feedback.error('Cette équipe est encore utilisée et ne peut pas être supprimée.')
  } catch {
    feedback.error('Cette équipe est encore utilisée et ne peut pas être supprimée.')
  }
}

function applyDirectory(directory: { members: EnterpriseUser[]; available: EnterpriseUser[] }) {
  teamMembers.value = directory.members
  availableAgents.value = directory.available
}

async function manageMembers(team: Team) {
  selectedTeam.value = team
  selectedAgentIds.value = []
  membersDialog.value = true
  loadingMembers.value = true
  try {
    applyDirectory(await store.loadTeamAgentDirectory(team.id))
  } catch (error) {
    feedback.error(error instanceof Error ? error.message : 'Impossible de charger les agents de cette équipe.')
  } finally {
    loadingMembers.value = false
  }
}

async function addMembers() {
  if (!selectedTeam.value || !selectedAgentIds.value.length) return
  savingMembers.value = true
  try {
    applyDirectory(await store.addTeamMembers(selectedTeam.value.id, selectedAgentIds.value))
    selectedAgentIds.value = []
    feedback.success('Les agents ont été ajoutés à l’équipe.')
  } catch (error) {
    feedback.error(error instanceof Error ? error.message : 'Impossible d’ajouter les agents à cette équipe.')
  } finally {
    savingMembers.value = false
  }
}

async function removeMember(userId: string) {
  if (!selectedTeam.value) return
  const agent = teamMembers.value.find((member) => member.id === userId)
  const confirmed = await feedback.askConfirmation({ title: 'Retirer cet agent ?', message: `${agent ? `${agent.firstName} ${agent.lastName}` : 'Cet agent'} ne fera plus partie de l’équipe « ${selectedTeam.value.name} ».`, confirmText: 'Retirer', color: 'error' })
  if (!confirmed) return
  savingMembers.value = true
  try {
    applyDirectory(await store.removeTeamMembers(selectedTeam.value.id, [userId]))
    feedback.success('Agent retiré de l’équipe.')
  } catch (error) {
    feedback.error(error instanceof Error ? error.message : 'Impossible de retirer cet agent de l’équipe.')
  } finally {
    savingMembers.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Équipes</template>
      <template #description>Structurez les équipes et affectez leurs agents avant de les associer aux missions.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-account-multiple-plus-outline" :to="{ name: 'admin-team-create' }">Nouvelle équipe</v-btn></template>
    </PageHeader>

    <TeamTable
      :teams="teams"
      :users="teamDirectoryUsers"
      :cursor-page="teamPage"
      :has-next-page="Boolean(teamNextCursor)"
      :has-previous-page="teamCursorHistory.length > 0"
      @edit="router.push({ name: 'admin-team-edit', params: { teamId: $event.id } })"
      @manage-members="manageMembers"
      @remove="remove"
      @next-page="store.nextTeamPage"
      @previous-page="store.previousTeamPage"
    />

    <TeamMembersDialog
      v-model="membersDialog"
      v-model:selected-ids="selectedAgentIds"
      :team="selectedTeam"
      :members="teamMembers"
      :available-agents="availableAgents"
      :loading="loadingMembers"
      :saving="savingMembers"
      @add="addMembers"
      @remove="removeMember"
    />
  </div>
</template>
