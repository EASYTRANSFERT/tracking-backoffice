<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamTable from '@/Components/teams/TeamTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useProfileScope } from '@/composables/useProfileScope'

const route = useRoute()
const store = useAdministratorStore()
const { teamDirectoryUsers, teamPage, teamNextCursor, teamCursorHistory } = storeToRefs(store)
const { supervisedTeams } = useProfileScope()
const directory = computed(() => route.meta.directory ?? 'teams')
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Mes équipes</template>
      <template #description>Équipes dont vous êtes le superviseur désigné.</template>
      <template #actions><v-chip color="secondary" variant="tonal" prepend-icon="mdi-eye-outline">Lecture seule</v-chip></template>
    </PageHeader>
    <TeamTable v-if="directory === 'teams'" :teams="supervisedTeams" :users="teamDirectoryUsers" readonly :cursor-page="teamPage" :has-next-page="Boolean(teamNextCursor)" :has-previous-page="teamCursorHistory.length > 0" @next-page="store.nextTeamPage" @previous-page="store.previousTeamPage" />
  </div>
</template>
