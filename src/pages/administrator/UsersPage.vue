<script setup lang="ts">
import { fullName } from '@/utils/people'
import { getApiErrorMessage } from '@/utils/api-error'
import { storeToRefs } from 'pinia'; import { useRouter } from 'vue-router';
import UserTable from '@/Components/users/UserTable.vue';
import PageHeader from '@/Components/layout/PageHeader.vue';
import { useAdministratorStore } from '@/stores/administrator.store';
import { useUiFeedbackStore } from '@/stores/ui-feedback.store';
import type { EnterpriseUser } from '@/types/administrator'

const router = useRouter();
const store = useAdministratorStore();
const feedback = useUiFeedbackStore();
const { users, knownTeams, canReactivateUsers, userPage, userNextCursor, userCursorHistory } = storeToRefs(store)
const view = (user: EnterpriseUser) => router.push({ name: 'admin-user-details', params: { userId: user.id } });
store.loadTeamOptions().catch(() => undefined)
const edit = (user: EnterpriseUser) => router.push({ name: 'admin-user-edit', params: { userId: user.id } })

async function changeStatus(user: EnterpriseUser) {
  const wasDisabled = user.status === 'disabled';
  if (wasDisabled && !canReactivateUsers.value) {
    feedback.error("L’API ne fournit pas encore de réactivation utilisateur.");
    return
  }
  const action = wasDisabled ? 'réactiver' : 'désactiver';
  const confirmed = await feedback.askConfirmation({
    title: `${action[0]?.toUpperCase()}${action.slice(1)} ce compte ?`,
    message: `Vous allez ${action} le compte de ${fullName(user)}.`,
    confirmText: action[0]?.toUpperCase() + action.slice(1), color: wasDisabled ? 'success' : 'error'
    });
    if (!confirmed) return;
    try {
      await store.toggleUserStatus(user.id);
      feedback.success(wasDisabled ? 'Compte réactivé.' : 'Compte désactivé.') }
      catch (error) { feedback.error(getApiErrorMessage(error, 'Action impossible.')) } }
</script>
<template>
<div class="mx-auto w-full max-w-[1440px]">
  <PageHeader>
    <template #title>Employés</template>
    <template #description>Gérez les membres, leurs rôles et leurs équipes.</template>
    <template #actions>
      <v-btn variant="outlined" color="secondary" prepend-icon="mdi-file-upload-outline" :to="{ name: 'admin-user-import' }">Importer les matricules</v-btn>
      <v-btn color="primary" prepend-icon="mdi-account-plus-outline" :to="{ name: 'admin-user-create' }">Nouvel agent</v-btn>
      </template>
      </PageHeader>
      <UserTable :users="users"
                 :teams="knownTeams"
                 :cursor-page="userPage"
                 :has-next-page="Boolean(userNextCursor)"
                 :has-previous-page="userCursorHistory.length > 0"
                 @view="view"
                 @edit="edit"
                 @change-status="changeStatus"
                 @next-page="store.nextUserPage"
                 @previous-page="store.previousUserPage"
        />
      </div>
    </template>
