<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { computed, ref } from 'vue'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import CompanyStatusIcon from '@/Components/companies/CompanyStatusIcon.vue'
import type { Company, CompanyStatus, Offer } from '@/types/operator'

const props = withDefaults(
  defineProps<{
    companies: Company[]
    offers: Offer[]
    title?: string
    description?: string
    searchable?: boolean
    pageSize?: number
  }>(),
  {
    title: 'Entreprises clientes',
    description: 'Consultez et gérez les entreprises de la plateforme',
    searchable: true,
    pageSize: 5,
  },
)

const emit = defineEmits<{
  view: [company: Company]
  edit: [company: Company]
  changeStatus: [company: Company]
}>()

const search = ref('')
const selectedStatus = ref<CompanyStatus | 'all'>('all')

const statusOptions = [
  { title: 'Tous les statuts', value: 'all' },
  { title: 'Actives', value: 'active' },
  { title: 'En attente', value: 'pending' },
  { title: 'Suspendues', value: 'suspended' },
]

const filteredCompanies = computed(() => {
  return props.companies.filter((company) => {
    const matchesStatus = selectedStatus.value === 'all' || company.status === selectedStatus.value
    return matchesSearch(search.value, company.legalName, company.contactEmail) && matchesStatus
  })
})

const cell = 'whitespace-nowrap text-sm text-[#535865]'
const columns: AppDataTableColumn[] = [
  { key: 'company', title: 'Entreprise', class: '!h-12 !font-semibold text-[#747985]' },
  { key: 'country', title: 'Pays', class: '!h-12 !font-semibold text-[#747985]', cellClass: cell },
  { key: 'offer', title: 'Offre', class: '!h-12 !font-semibold text-[#747985]', cellClass: `${cell} font-medium` },
  { key: 'status', title: 'Statut', class: '!h-12 !font-semibold text-[#747985]' },
  { key: 'actions', title: 'Actions', class: '!h-12 w-16', srOnly: true },
]

function getOfferName(offerId: string) {
  return props.offers.find((offer) => offer.id === offerId)?.name ?? 'Non attribuée'
}
</script>

<template>
  <AppDataTable
    :items="filteredCompanies"
    :columns="columns"
    :page-size="pageSize"
    :reset-on="[search, selectedStatus]"
    :title="title"
    :subtitle="description"
    label="entreprises"
    header-class="lg:flex-row lg:items-center"
    table-class="min-w-[760px]"
    clickable
    empty-icon="mdi-domain-off"
    empty-title="Aucune entreprise trouvée"
    empty-description="Modifiez votre recherche ou vos filtres pour afficher d’autres résultats."
    @click:row="emit('view', $event)"
  >
    <template v-if="searchable" #filters>
      <div class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px] lg:max-w-[500px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une entreprise" density="compact" hide-details clearable />
        <v-select v-model="selectedStatus" :items="statusOptions" density="compact" hide-details />
      </div>
    </template>
    <template #cell-company="{ item: company }">
      <div class="flex min-h-16 items-center gap-3 py-2">
        <v-avatar color="red-lighten-5" size="40" rounded="lg">
          <CompanyStatusIcon :suspended="company.status === 'suspended'" :size="23" />
        </v-avatar>
        <div class="min-w-0">
          <p class="truncate font-semibold text-[#292d38]">{{ company.legalName }}</p>
          <p class="truncate text-xs text-[#848484]">{{ company.contactEmail }}</p>
        </div>
      </div>
    </template>
    <template #cell-offer="{ item: company }">{{ getOfferName(company.offerId) }}</template>
    <template #cell-status="{ item: company }"><div class="flex min-h-16 items-center"><AppStatusChip :status="company.status" /></div></template>
    <template #cell-actions="{ item: company }">
      <div @click.stop>
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" aria-label="Actions" />
          </template>
          <v-list density="compact" min-width="190">
            <v-list-item prepend-icon="mdi-eye-outline" title="Voir les détails" @click="emit('view', company)" />
            <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', company)" />
            <v-divider class="my-1" />
            <v-list-item
              :prepend-icon="company.status === 'active' ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"
              :title="company.status === 'pending' ? 'Activer' : company.status === 'suspended' ? 'Réactiver' : 'Suspendre'"
              :subtitle="company.status === 'pending' && !company.offerId ? 'Attribuez d’abord une offre' : undefined"
              :disabled="company.status === 'pending' && !company.offerId"
              :class="company.status === 'active' ? 'text-error' : 'text-success'"
              @click="emit('changeStatus', company)"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </AppDataTable>
</template>
