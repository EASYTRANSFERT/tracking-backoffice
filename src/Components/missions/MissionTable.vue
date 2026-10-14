<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import type { EnterpriseUser, Mission, MissionStatus, Site, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{
  missions: Mission[]; sites: Site[]; users: EnterpriseUser[]; teams: Team[]
  pageSize?: number; title?: string; description?: string; showActions?: boolean; rowClickable?: boolean
}>(), { pageSize: 6, title: 'Planification des missions', description: 'Affectez les équipes et suivez l’exécution sur les sites.', showActions: true, rowClickable: true })
const emit = defineEmits<{ view: [mission: Mission]; edit: [mission: Mission]; cancel: [mission: Mission] }>()
const search = ref(''); const status = ref<MissionStatus | 'all'>('all'); const dateFrom = ref(''); const dateTo = ref(''); const page = ref(1)
const teamName = (id: string) => props.teams.find((team) => team.id === id)?.name ?? 'Équipe inconnue'
const memberCount = (id: string) => props.users.filter((user) => user.teamId === id && user.role === 'agent').length
const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return [...props.missions].filter((mission) => {
    const startDate = mission.startAt.slice(0, 10)
    return (!query || `${mission.title} ${teamName(mission.teamId)}`.toLocaleLowerCase('fr').includes(query))
      && (status.value === 'all' || mission.status === status.value)
      && (!dateFrom.value || startDate >= dateFrom.value)
      && (!dateTo.value || startDate <= dateTo.value)
  }).sort((a, b) => b.startAt.localeCompare(a.startAt))
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / props.pageSize)))
const start = computed(() => (page.value - 1) * props.pageSize)
const displayed = computed(() => filtered.value.slice(start.value, start.value + props.pageSize))
watch([search, status, dateFrom, dateTo], () => { page.value = 1 })
const siteName = (id: string) => props.sites.find((site) => site.id === id)?.name ?? 'Site inconnu'
const userName = (id: string) => { const user = props.users.find((item) => item.id === id); return user ? `${user.firstName} ${user.lastName}` : 'Non affecté' }
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 xl:flex-row xl:items-start">
      <div><div class="flex items-center gap-3"><h2 class="text-lg font-bold text-[#252830]">{{ title }}</h2><v-chip color="primary" variant="tonal">{{ filtered.length }}</v-chip></div><p class="mt-1 text-xs text-[#747985]">{{ description }}</p></div><v-spacer />
      <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[760px] xl:grid-cols-4"><v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher" density="compact" hide-details clearable /><v-select v-model="status" :items="[{title:'Tous les statuts',value:'all'},{title:'Planifiées',value:'scheduled'},{title:'En cours',value:'ongoing'},{title:'Terminées',value:'completed'},{title:'Annulées',value:'cancelled'}]" density="compact" hide-details /><v-text-field v-model="dateFrom" type="date" label="Du" density="compact" hide-details /><v-text-field v-model="dateTo" type="date" label="Au" density="compact" hide-details /></div>
    </div><v-divider />
    <div v-if="displayed.length" class="overflow-x-auto"><v-table hover class="min-w-[940px]"><thead><tr><th>Mission</th><th>Site</th><th>Début</th><th>Superviseur</th><th>Équipe</th><th>Statut</th><th v-if="showActions" class="w-16"><span class="sr-only">Actions</span></th></tr></thead><tbody><tr v-for="mission in displayed" :key="mission.id" :class="rowClickable ? 'cursor-pointer' : ''" @click="rowClickable && emit('view', mission)"><td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-clipboard-text-clock-outline" color="primary" /></v-avatar><div><p class="font-semibold text-[#292d38]">{{ mission.title }}</p><p class="text-xs text-[#848484]">{{ memberCount(mission.teamId) }} agent(s)</p></div></div></td><td class="text-sm text-[#535865]">{{ siteName(mission.siteId) }}</td><td class="whitespace-nowrap text-sm text-[#535865]">{{ formatDate(mission.startAt) }}</td><td class="text-sm text-[#535865]">{{ userName(mission.supervisorId) }}</td><td class="text-sm text-[#535865]">{{ teamName(mission.teamId) }}</td><td><AppStatusChip :status="mission.status" /></td><td v-if="showActions" @click.stop><v-menu location="bottom end"><template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template><v-list density="compact"><v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', mission)" /><v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', mission)" /><v-divider /><v-list-item v-if="!['completed','cancelled'].includes(mission.status)" prepend-icon="mdi-close-circle-outline" title="Annuler la mission" class="text-error" @click="emit('cancel', mission)" /></v-list></v-menu></td></tr></tbody></v-table></div>
    <AppEmptyState v-else icon="mdi-clipboard-search-outline" title="Aucune mission trouvée" description="Créez une mission ou modifiez vos filtres." /><AppTableFooter v-if="filtered.length" :page="page" :page-count="pageCount" :start="start + 1" :end="Math.min(start + pageSize, filtered.length)" :total="filtered.length" label="missions" @update:page="page = $event" />
  </v-card>
</template>
