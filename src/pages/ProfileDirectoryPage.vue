<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamTable from '@/Components/teams/TeamTable.vue'
import UserTable from '@/Components/users/UserTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'

const route = useRoute()
const store = useAdministratorStore()
const { users, teams, userPage, userNextCursor, userCursorHistory, teamPage, teamNextCursor, teamCursorHistory } = storeToRefs(store)
const directory = computed(() => route.meta.directory ?? 'users')
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>{{ directory === 'users' ? 'Utilisateurs' : 'Équipes' }}</template>
      <template #description>Consultation des données autorisées par votre profil et votre périmètre.</template>
      <template #actions><v-chip color="secondary" variant="tonal" prepend-icon="mdi-eye-outline">Lecture seule</v-chip></template>
    </PageHeader>
    <UserTable v-if="directory === 'users'" :users="users" :teams="teams" readonly :cursor-page="userPage" :has-next-page="Boolean(userNextCursor)" :has-previous-page="userCursorHistory.length > 0" @next-page="store.nextUserPage" @previous-page="store.previousUserPage" />
    <TeamTable v-else :teams="teams" :users="users" readonly :cursor-page="teamPage" :has-next-page="Boolean(teamNextCursor)" :has-previous-page="teamCursorHistory.length > 0" @next-page="store.nextTeamPage" @previous-page="store.previousTeamPage" />
  </div>
</template>
