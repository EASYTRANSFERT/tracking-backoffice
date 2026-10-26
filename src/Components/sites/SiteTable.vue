<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { nameOr } from '@/utils/people'
import { computed, ref, watch } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import SitesMap from '@/Components/sites/SitesMap.vue'
import type { EnterpriseUser, Site, SiteStatus } from '@/types/administrator'
const props = withDefaults(defineProps<{ sites: Site[]; users: EnterpriseUser[]; pageSize?: number }>(), { pageSize: 6 })
const emit = defineEmits<{ view: [site: Site]; edit: [site: Site]; changeStatus: [site: Site] }>()
const search = ref(''); const status = ref<SiteStatus | 'all'>('all'); const page = ref(1); const displayMode = ref<'table' | 'map'>('table')
const filtered = computed(() => { return props.sites.filter((site) => matchesSearch(search.value, site.name, site.address, site.city) && (status.value === 'all' || site.status === status.value)) })
const pageCount = computed(() => Math.ceil(filtered.value.length / props.pageSize)); const start = computed(() => (page.value - 1) * props.pageSize); const displayed = computed(() => filtered.value.slice(start.value, start.value + props.pageSize))
watch([search, status], () => { page.value = 1 })
const managerName = (id?: string) => { const user = props.users.find((item) => item.id === id); return nameOr(user) }
</script>
<template>
  <v-card class="overflow-hidden"><div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center"><div><h2 class="text-lg font-bold text-[#252830]">Sites opérationnels</h2><p class="mt-1 text-xs text-[#747985]">Configurez la géolocalisation et les QR codes des sites.</p></div><v-spacer /><div class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px_auto] lg:max-w-[650px]"><v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un site" density="compact" hide-details clearable /><v-select v-model="status" :items="[{title:'Tous les statuts',value:'all'},{title:'À compléter',value:'draft'},{title:'Actifs',value:'active'},{title:'Archivés',value:'inactive'}]" density="compact" hide-details /><v-btn-toggle v-model="displayMode" mandatory color="primary" variant="outlined" density="comfortable"><v-btn value="table" icon="mdi-table" aria-label="Vue tableau" /><v-btn value="map" icon="mdi-map-outline" aria-label="Vue carte" /></v-btn-toggle></div></div><v-divider />
    <template v-if="displayMode === 'table'">
      <div v-if="displayed.length" class="overflow-x-auto"><v-table hover class="min-w-[800px]"><thead><tr><th>Site</th><th>Superviseur</th><th>Zone autorisée</th><th>QR code</th><th>Statut</th><th class="w-16"><span class="sr-only">Actions</span></th></tr></thead><tbody><tr v-for="site in displayed" :key="site.id" class="cursor-pointer" @click="emit('view', site)"><td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-outline" color="primary" /></v-avatar><div><p class="font-semibold text-[#292d38]">{{ site.name }}</p><p class="text-xs text-[#848484]">{{ [site.city, site.address].filter(Boolean).join(' · ') || 'Informations à compléter' }}</p></div></div></td><td class="text-sm text-[#535865]">{{ managerName(site.managerId) }}</td><td class="text-sm text-[#535865]">{{ site.radiusM ? `${site.radiusM} m` : 'À définir' }}</td><td><v-chip prepend-icon="mdi-qrcode" variant="outlined" size="small">Attribué</v-chip></td><td><AppStatusChip :status="site.status" /></td><td @click.stop><v-menu location="bottom end"><template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template><v-list density="compact"><v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', site)" /><v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', site)" /><v-divider /><v-list-item v-if="site.status !== 'inactive'" :title="site.status === 'draft' ? 'Compléter la configuration' : 'Archiver'" @click="site.status === 'draft' ? emit('edit', site) : emit('changeStatus', site)" /></v-list></v-menu></td></tr></tbody></v-table></div>
      <AppEmptyState v-else icon="mdi-map-marker-off-outline" title="Aucun site trouvé" description="Créez un site ou modifiez vos filtres." /><AppTableFooter v-if="filtered.length" :page="page" :page-count="pageCount" :start="start + 1" :end="Math.min(start + pageSize, filtered.length)" :total="filtered.length" label="sites" @update:page="page = $event" />
    </template>
    <SitesMap v-else :sites="filtered" :users="users" @view="emit('view', $event)" />
  </v-card>
</template>
