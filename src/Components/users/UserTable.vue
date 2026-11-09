<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { fullName } from '@/utils/people'
import { computed, ref } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import type { EnterpriseUser, EnterpriseUserRole, EnterpriseUserStatus, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{ users: EnterpriseUser[]; teams: Team[]; pageSize?: number; readonly?: boolean }>(), { pageSize: 6, readonly: false })
const emit = defineEmits<{ view: [user: EnterpriseUser]; edit: [user: EnterpriseUser]; changeStatus: [user: EnterpriseUser] }>()
const search = ref('')
const status = ref<EnterpriseUserStatus | 'all'>('all')
const role = ref<EnterpriseUserRole | 'all'>('all')
const roleLabels: Record<EnterpriseUserRole, string> = { administrator: 'Administrateur', supervisor: 'Superviseur', teamLeader: 'Chef d’équipe', agent: 'Agent' }
const roleItems = [{ title: 'Tous les rôles', value: 'all' }, { title: 'Administrateur', value: 'administrator' }, { title: 'Superviseur', value: 'supervisor' }, { title: 'Chef d’équipe', value: 'teamLeader' }, { title: 'Agent', value: 'agent' }]
const statusItems = [{ title: 'Tous les statuts', value: 'all' }, { title: 'Actifs', value: 'active' }, { title: 'Invités', value: 'invited' }, { title: 'Désactivés', value: 'disabled' }]
const filtered = computed(() => props.users.filter((user) =>
  matchesSearch(search.value, fullName(user), user.email, user.employeeNumber) && (status.value === 'all' || user.status === status.value) && (role.value === 'all' || user.role === role.value)))
const teamName = (teamId?: string) => props.teams.find((team) => team.id === teamId)?.name ?? '—'

const cell = 'text-sm text-[#535865]'
const columns: AppDataTableColumn[] = [
  { key: 'user', title: 'Employés' },
  { key: 'role', title: 'Rôle', cellClass: cell },
  { key: 'team', title: 'Équipe', cellClass: cell },
  { key: 'employeeNumber', title: 'Matricule', cellClass: cell },
  { key: 'status', title: 'Statut' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true },
]
</script>

<template>
  <AppDataTable
    :items="filtered"
    :columns="columns"
    :page-size="pageSize"
    :reset-on="[search, status, role]"
    title="Personnel de l’entreprise"
    subtitle="Gérez les accès, rôles et équipes de vos collaborateurs."
    label="agents"
    header-class="2xl:flex-row 2xl:items-center"
    table-class="min-w-[900px]"
    clickable
    empty-icon="mdi-account-search-outline"
    empty-title="Aucun agent trouvé"
    empty-description="Modifiez les filtres ou ajoutez un nouvel agent."
    @click:row="emit('view', $event)"
  >
    <template #filters>
      <div class="grid w-full gap-3 sm:grid-cols-3 2xl:max-w-[760px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Nom, e-mail ou matricule" density="compact" hide-details clearable />
        <v-select v-model="role" :items="roleItems" density="compact" hide-details />
        <v-select v-model="status" :items="statusItems" density="compact" hide-details />
      </div>
    </template>
    <template #cell-user="{ item: user }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" size="40"><span class="text-xs font-bold text-primary">{{ user.firstName[0] }}{{ user.lastName[0] }}</span></v-avatar>
        <div><p class="font-semibold text-[#292d38]">{{ user.firstName }} {{ user.lastName }}</p><p class="text-xs text-[#848484]">{{ user.email }}</p></div>
      </div>
    </template>
    <template #cell-role="{ item: user }">{{ roleLabels[user.role] }}</template>
    <template #cell-team="{ item: user }">{{ teamName(user.teamId) }}</template>
    <template #cell-status="{ item: user }"><AppStatusChip :status="user.status" /></template>
    <template #cell-actions="{ item: user }">
      <div @click.stop>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', user)" />
            <template v-if="!readonly">
              <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', user)" />
              <v-divider />
              <v-list-item :prepend-icon="user.status === 'disabled' ? 'mdi-account-check-outline' : 'mdi-account-off-outline'" :title="user.status === 'disabled' ? 'Réactiver' : 'Désactiver'" @click="emit('changeStatus', user)" />
            </template>
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
