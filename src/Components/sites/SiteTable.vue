<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { computed, ref } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import SitesMap from '@/Components/sites/SitesMap.vue'
import type { Site, SiteStatus } from '@/types/administrator'

const props = withDefaults(defineProps<{ sites: Site[]; supervisorName: (site: Site) => string; pageSize?: number }>(), { pageSize: 6 })
const emit = defineEmits<{ view: [site: Site]; edit: [site: Site]; changeStatus: [site: Site] }>()
const search = ref('')
const status = ref<SiteStatus | 'all'>('all')
const displayMode = ref<'table' | 'map'>('table')
const statusItems = [{ title: 'Tous les statuts', value: 'all' }, { title: 'À compléter', value: 'draft' }, { title: 'Actifs', value: 'active' }, { title: 'Archivés', value: 'inactive' }]
const filtered = computed(() => props.sites.filter((site) => matchesSearch(search.value, site.name, site.address, site.city) && (status.value === 'all' || site.status === status.value)))

const cell = 'text-sm text-[#535865]'
const columns: AppDataTableColumn[] = [
  { key: 'site', title: 'Site' },
  { key: 'supervisor', title: 'Superviseur', cellClass: cell },
  { key: 'radius', title: 'Zone autorisée', cellClass: cell },
  { key: 'qr', title: 'QR code' },
  { key: 'status', title: 'Statut' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true },
]
</script>

<template>
  <AppDataTable
    :items="filtered"
    :columns="columns"
    :page-size="pageSize"
    :reset-on="[search, status]"
    title="Sites opérationnels"
    subtitle="Configurez la géolocalisation et les QR codes des sites."
    label="sites"
    header-class="lg:flex-row lg:items-center"
    table-class="min-w-[800px]"
    clickable
    empty-icon="mdi-map-marker-off-outline"
    empty-title="Aucun site trouvé"
    empty-description="Créez un site ou modifiez vos filtres."
    @click:row="emit('view', $event)"
  >
    <template #filters>
      <div class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px_auto] lg:max-w-[650px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un site" density="compact" hide-details clearable />
        <v-select v-model="status" :items="statusItems" density="compact" hide-details />
        <v-btn-toggle v-model="displayMode" mandatory color="primary" variant="outlined" density="comfortable">
          <v-btn value="table" icon="mdi-table" aria-label="Vue tableau" />
          <v-btn value="map" icon="mdi-map-outline" aria-label="Vue carte" />
        </v-btn-toggle>
      </div>
    </template>
    <template v-if="displayMode === 'map'" #body>
      <SitesMap :sites="filtered" :supervisor-name="supervisorName" @view="emit('view', $event)" />
    </template>
    <template #cell-site="{ item: site }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-outline" color="primary" /></v-avatar>
        <div>
          <p class="font-semibold text-[#292d38]">{{ site.name }}</p>
          <p class="text-xs text-[#848484]">{{ [site.city, site.address].filter(Boolean).join(' · ') || 'Informations à compléter' }}</p>
        </div>
      </div>
    </template>
    <template #cell-supervisor="{ item: site }">{{ supervisorName(site) }}</template>
    <template #cell-radius="{ item: site }">{{ site.radiusM ? `${site.radiusM} m` : 'À définir' }}</template>
    <template #cell-qr="{ item: site }">
      <v-chip prepend-icon="mdi-qrcode" variant="outlined" size="small" :color="site.qrRotatedAt ? 'success' : undefined">{{ site.qrRotatedAt ? 'Généré' : 'Non généré' }}</v-chip>
    </template>
    <template #cell-status="{ item: site }"><AppStatusChip :status="site.status" /></template>
    <template #cell-actions="{ item: site }">
      <div @click.stop>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" /></template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-eye-outline" title="Voir" @click="emit('view', site)" />
            <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', site)" />
            <v-divider />
            <v-list-item v-if="site.status !== 'inactive'" :title="site.status === 'draft' ? 'Compléter la configuration' : 'Archiver'" @click="site.status === 'draft' ? emit('edit', site) : emit('changeStatus', site)" />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
