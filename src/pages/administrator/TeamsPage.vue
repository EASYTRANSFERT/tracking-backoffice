<script setup lang="ts">
import { nameOr } from '@/utils/people'
import { getApiErrorMessage } from '@/utils/api-error'
import { onMounted, ref, watch } from 'vue'
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
const { teams, teamDirectoryUsers, teamMemberCounts } = storeToRefs(store)

// Les noms des chefs d'équipe ne sont pas forcément dans la page d'utilisateurs déjà chargée.
onMounted(() => { store.loadTeamLeadOptions().catch(() => undefined) })

// Effectif et nom du chef de chaque équipe affichée (la liste des utilisateurs est paginée).
// Les membres chargés pour l'effectif fournissent déjà le nom du chef : on ne demande que ceux qui manquent.
watch(teams, async (shown) => {
  await store.loadTeamMemberCounts(shown.map((team) => team.id)).catch(() => undefined)
  await store.ensureUsers(shown.map((team) => team.leadUserId)).catch(() => undefined)
}, { immediate: true })
const refreshCount = (teamId: string) => { store.loadTeamMemberCounts([teamId]).catch(() => undefined) }

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
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de supprimer cette équipe.'))
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
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les agents de cette équipe.'))
  } finally {
    loadingMembers.value = false
  }
}

async function addMembers() {
  if (!selectedTeam.value || !selectedAgentIds.value.length) return
  savingMembers.value = true
  try {
    applyDirectory(await store.addTeamMembers(selectedTeam.value.id, selectedAgentIds.value))
    refreshCount(selectedTeam.value.id)
    selectedAgentIds.value = []
    feedback.success('Les agents ont été ajoutés à l’équipe.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’ajouter les agents à cette équipe.'))
  } finally {
    savingMembers.value = false
  }
}

async function removeMember(userId: string) {
  if (!selectedTeam.value) return
  const agent = teamMembers.value.find((member) => member.id === userId)
  const confirmed = await feedback.askConfirmation({ title: 'Retirer cet agent ?', message: `${nameOr(agent, 'Cet agent')} ne fera plus partie de l’équipe « ${selectedTeam.value.name} ».`, confirmText: 'Retirer', color: 'error' })
  if (!confirmed) return
  savingMembers.value = true
  try {
    applyDirectory(await store.removeTeamMembers(selectedTeam.value.id, [userId]))
    refreshCount(selectedTeam.value.id)
    feedback.success('Agent retiré de l’équipe.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de retirer cet agent de l’équipe.'))
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
      :member-counts="teamMemberCounts"
      @open="router.push({ name: 'admin-team-details', params: { teamId: $event.id } })"
      @edit="router.push({ name: 'admin-team-edit', params: { teamId: $event.id } })"
      @manage-members="manageMembers"
      @remove="remove"
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
