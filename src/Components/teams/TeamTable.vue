<script setup lang="ts">
import { nameOr } from '@/utils/people'

import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import type { EnterpriseUser, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{
  teams: Team[]
  users: EnterpriseUser[]
  /** Membres (agents et chef) par équipe ; absent tant que le compte n'est pas chargé. */
  memberCounts?: Record<string, number>
  pageSize?: number
  readonly?: boolean
}>(), {
  pageSize: 8,
  readonly: false,
})

const emit = defineEmits<{
  open: [team: Team]
  edit: [team: Team]
  manageMembers: [team: Team]
  remove: [team: Team]
}>()

const columns: AppDataTableColumn[] = [
  { key: 'name', title: 'Équipe' },
  { key: 'lead', title: 'Chef d’équipe' },
  { key: 'members', title: 'Membres' },
  { key: 'updatedAt', title: 'Dernière mise à jour' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true },
]
const userName = (id?: string) => {
  const user = props.users.find((item) => item.id === id)
  return nameOr(user)
}
const members = (id: string) => props.memberCounts?.[id]
</script>

<template>
  <AppDataTable
    :items="teams"
    :columns="columns"
    :page-size="pageSize"
    :search-text="(team) => [team.name]"
    search-placeholder="Rechercher une équipe"
    title="Équipes de l’entreprise"
    subtitle="Une équipe regroupe un chef et les agents affectés."
    label="équipes"
    clickable
    empty-icon="mdi-account-group-outline"
    empty-title="Aucune équipe trouvée"
    empty-description="Créez une équipe pour y affecter les agents."
    @click:row="emit('open', $event)"
  >
    <template #cell-name="{ item: team }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-group-outline" color="primary" /></v-avatar>
        <p class="font-semibold">{{ team.name }}</p>
      </div>
    </template>
    <template #cell-lead="{ item: team }">{{ userName(team.leadUserId) }}</template>
    <template #cell-members="{ item: team }">
      <v-btn v-if="!readonly" variant="tonal" color="primary" size="small" prepend-icon="mdi-account-group-outline" @click.stop="emit('manageMembers', team)">
        {{ members(team.id) ?? '…' }} membre{{ (members(team.id) ?? 0) > 1 ? 's' : '' }}
      </v-btn>
      <span v-else>{{ members(team.id) ?? '…' }}</span>
    </template>
    <template #cell-updatedAt="{ item: team }">{{ new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(team.updatedAt)) }}</template>
    <template #cell-actions="{ item: team }">
      <div @click.stop>
        <v-menu v-if="!readonly" location="bottom end">
          <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-account-multiple-outline" title="Gérer les agents" @click="emit('manageMembers', team)" />
            <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', team)" />
            <v-list-item prepend-icon="mdi-delete-outline" title="Supprimer" class="text-error" @click="emit('remove', team)" />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
