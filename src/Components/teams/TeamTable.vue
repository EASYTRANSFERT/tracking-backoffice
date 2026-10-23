<script setup lang="ts">
import { computed, ref } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import type { EnterpriseUser, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{
  teams: Team[]
  users: EnterpriseUser[]
  cursorPage?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  readonly?: boolean
}>(), {
  cursorPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  readonly: false,
})

const emit = defineEmits<{
  edit: [team: Team]
  manageMembers: [team: Team]
  remove: [team: Team]
  nextPage: []
  previousPage: []
}>()

const search = ref('')
const displayed = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return props.teams.filter((team) => !query || team.name.toLocaleLowerCase('fr').includes(query))
})
const userName = (id?: string) => {
  const user = props.users.find((item) => item.id === id)
  return user ? `${user.firstName} ${user.lastName}` : 'Non affecté'
}
const members = (id: string) => props.users.filter((user) => user.teamId === id && user.role === 'agent').length
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-bold text-[#252830]">Équipes de l’entreprise</h2>
        <p class="mt-1 text-xs text-[#747985]">Une équipe regroupe un chef et les agents affectés.</p>
      </div>
      <v-spacer />
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une équipe" density="compact" hide-details clearable class="w-full sm:max-w-xs" />
    </div>
    <v-divider />
    <div v-if="displayed.length" class="overflow-x-auto">
      <v-table hover>
        <thead><tr><th>Équipe</th><th>Chef d’équipe</th><th>Agents</th><th>Dernière mise à jour</th><th class="w-16"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="team in displayed" :key="team.id">
            <td class="font-semibold">{{ team.name }}</td>
            <td>{{ userName(team.leadUserId) }}</td>
            <td>
              <v-btn v-if="!readonly" variant="tonal" color="primary" size="small" prepend-icon="mdi-account-group-outline" @click="emit('manageMembers', team)">
                {{ members(team.id) }} agent{{ members(team.id) > 1 ? 's' : '' }}
              </v-btn>
              <span v-else>{{ members(team.id) }}</span>
            </td>
            <td>{{ new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(team.updatedAt)) }}</td>
            <td>
              <v-menu v-if="!readonly" location="bottom end">
                <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-account-multiple-outline" title="Gérer les agents" @click="emit('manageMembers', team)" />
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', team)" />
                  <v-list-item prepend-icon="mdi-delete-outline" title="Supprimer" class="text-error" @click="emit('remove', team)" />
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else icon="mdi-account-group-outline" title="Aucune équipe trouvée" description="Créez une équipe pour y affecter les agents." />
    <AppTableFooter v-if="displayed.length" mode="cursor" :page="cursorPage" :page-count="1" :start="1" :end="displayed.length" label="équipes" :has-next="hasNextPage" :has-previous="hasPreviousPage" @next="emit('nextPage')" @previous="emit('previousPage')" />
  </v-card>
</template>
