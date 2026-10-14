<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import type { EnterpriseUser, EnterpriseUserRole, EnterpriseUserStatus, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{ users: EnterpriseUser[]; teams: Team[]; pageSize?: number; cursorPage?: number; hasNextPage?: boolean; hasPreviousPage?: boolean; readonly?: boolean }>(), { pageSize: 6, cursorPage: undefined, hasNextPage: false, hasPreviousPage: false, readonly: false })
const emit = defineEmits<{ view: [user: EnterpriseUser]; edit: [user: EnterpriseUser]; changeStatus: [user: EnterpriseUser]; nextPage: []; previousPage: [] }>()
const search = ref('')
const status = ref<EnterpriseUserStatus | 'all'>('all')
const role = ref<EnterpriseUserRole | 'all'>('all')
const page = ref(1)
const roleLabels: Record<EnterpriseUserRole, string> = { administrator: 'Administrateur', supervisor: 'Superviseur', teamLeader: 'Chef d’équipe', agent: 'Agent' }
const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return props.users.filter((user) => {
    const name = `${user.firstName} ${user.lastName} ${user.email} ${user.employeeNumber}`.toLocaleLowerCase('fr')
    return (!query || name.includes(query)) && (status.value === 'all' || user.status === status.value) && (role.value === 'all' || user.role === role.value)
  })
})
const pageCount = computed(() => Math.ceil(filtered.value.length / props.pageSize))
const start = computed(() => (page.value - 1) * props.pageSize)
const usesCursorPagination = computed(() => props.cursorPage !== undefined)
const displayed = computed(() => usesCursorPagination.value ? filtered.value : filtered.value.slice(start.value, start.value + props.pageSize))
watch([search, status, role], () => { page.value = 1 })
const teamName = (teamId?: string) => props.teams.find((team) => team.id === teamId)?.name ?? '—'
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 xl:flex-row xl:items-center">
      <div><h2 class="text-lg font-bold text-[#252830]">Personnel de l’entreprise</h2><p class="mt-1 text-xs text-[#747985]">Gérez les accès, rôles et équipes de vos collaborateurs.</p></div>
      <v-spacer />
      <div class="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[760px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Nom, e-mail ou matricule" density="compact" hide-details clearable />
        <v-select v-model="role" :items="[{title:'Tous les rôles',value:'all'},{title:'Administrateur',value:'administrator'},{title:'Superviseur',value:'supervisor'},{title:'Chef d’équipe',value:'teamLeader'},{title:'Agent',value:'agent'}]" density="compact" hide-details />
        <v-select v-model="status" :items="[{title:'Tous les statuts',value:'all'},{title:'Actifs',value:'active'},{title:'Invités',value:'invited'},{title:'Désactivés',value:'disabled'}]" density="compact" hide-details />
      </div>
    </div>
    <v-divider />
    <div v-if="displayed.length" class="overflow-x-auto">
      <v-table hover class="min-w-[900px]">
        <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Équipe</th><th>Matricule</th><th>Statut</th><th class="w-16"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="user in displayed" :key="user.id" class="cursor-pointer" @click="emit('view', user)">
            <td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" size="40"><span class="text-xs font-bold text-primary">{{ user.firstName[0] }}{{ user.lastName[0] }}</span></v-avatar><div><p class="font-semibold text-[#292d38]">{{ user.firstName }} {{ user.lastName }}</p><p class="text-xs text-[#848484]">{{ user.email }}</p></div></div></td>
            <td class="text-sm text-[#535865]">{{ roleLabels[user.role] }}</td><td class="text-sm text-[#535865]">{{ teamName(user.teamId) }}</td><td class="text-sm text-[#535865]">{{ user.employeeNumber }}</td>
            <td><AppStatusChip :status="user.status" /></td>
            <td @click.stop><v-menu location="bottom end"><template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template><v-list density="compact"><v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', user)" /><template v-if="!readonly"><v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', user)" /><v-divider /><v-list-item :prepend-icon="user.status === 'disabled' ? 'mdi-account-check-outline' : 'mdi-account-off-outline'" :title="user.status === 'disabled' ? 'Réactiver' : 'Désactiver'" @click="emit('changeStatus', user)" /></template></v-list></v-menu></td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else icon="mdi-account-search-outline" title="Aucun utilisateur trouvé" description="Modifiez les filtres ou ajoutez un nouvel utilisateur." />
    <AppTableFooter v-if="filtered.length" :page="cursorPage ?? page" :page-count="pageCount" :start="usesCursorPagination ? 1 : start + 1" :end="usesCursorPagination ? displayed.length : Math.min(start + pageSize, filtered.length)" :total="usesCursorPagination ? undefined : filtered.length" label="utilisateurs" :mode="usesCursorPagination ? 'cursor' : 'numbered'" :has-next="hasNextPage" :has-previous="hasPreviousPage" @update:page="page = $event" @next="emit('nextPage')" @previous="emit('previousPage')" />
  </v-card>
</template>
