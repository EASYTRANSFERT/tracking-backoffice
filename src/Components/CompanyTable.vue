<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
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
const page = ref(1)

const statusOptions = [
  { title: 'Tous les statuts', value: 'all' },
  { title: 'Actives', value: 'active' },
  { title: 'En attente', value: 'pending' },
  { title: 'Suspendues', value: 'suspended' },
]

const filteredCompanies = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return props.companies.filter((company) => {
    const matchesSearch =
      !query ||
      company.legalName.toLocaleLowerCase('fr').includes(query) ||
      company.contactEmail.toLocaleLowerCase('fr').includes(query)
    const matchesStatus = selectedStatus.value === 'all' || company.status === selectedStatus.value
    return matchesSearch && matchesStatus
  })
})

const pageCount = computed(() => Math.ceil(filteredCompanies.value.length / props.pageSize))
const pageStart = computed(() => (page.value - 1) * props.pageSize)
const displayedCompanies = computed(() => filteredCompanies.value.slice(pageStart.value, pageStart.value + props.pageSize))

watch([search, selectedStatus], () => { page.value = 1 })
watch(pageCount, (count) => {
  if (page.value > Math.max(count, 1)) page.value = Math.max(count, 1)
})

function getOfferName(offerId: string) {
  return props.offers.find((offer) => offer.id === offerId)?.name ?? 'Non attribuée'
}
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
      <div class="min-w-0">
        <h2 class="text-lg font-bold text-[#252830]">{{ title }}</h2>
        <p class="mt-1 text-xs text-[#747985]">{{ description }}</p>
      </div>
      <v-spacer />
      <div v-if="searchable" class="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px] lg:max-w-[500px]">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une entreprise" density="compact" hide-details clearable />
        <v-select v-model="selectedStatus" :items="statusOptions" density="compact" hide-details />
      </div>
    </div>

    <v-divider />

    <div v-if="displayedCompanies.length" class="overflow-x-auto">
      <v-table hover class="min-w-[760px]">
        <thead>
          <tr>
            <th class="!h-12 !font-semibold text-[#747985]">Entreprise</th>
            <th class="!h-12 !font-semibold text-[#747985]">Pays</th>
            <th class="!h-12 !font-semibold text-[#747985]">Offre</th>
            <th class="!h-12 !font-semibold text-[#747985]">Agents</th>
            <th class="!h-12 !font-semibold text-[#747985]">Statut</th>
            <th class="!h-12 w-16"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in displayedCompanies" :key="company.id" class="cursor-pointer" @click="emit('view', company)">
            <td>
              <div class="flex min-h-16 items-center gap-3 py-2">
                <v-avatar color="red-lighten-5" size="40" rounded="lg">
                  <CompanyStatusIcon :suspended="company.status === 'suspended'" :size="23" />
                </v-avatar>
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[#292d38]">{{ company.legalName }}</p>
                  <p class="truncate text-xs text-[#848484]">{{ company.contactEmail }}</p>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap text-sm text-[#535865]">{{ company.country }}</td>
            <td class="whitespace-nowrap text-sm font-medium text-[#535865]">{{ getOfferName(company.offerId) }}</td>
            <td class="text-sm text-[#535865]">{{ company.activeAgents }}</td>
            <td><div class="flex min-h-16 items-center"><AppStatusChip :status="company.status" /></div></td>
            <td @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-horizontal" variant="text" size="small" aria-label="Actions" />
                </template>
                <v-list density="compact" min-width="190">
                  <v-list-item prepend-icon="mdi-eye-outline" title="Voir les détails" @click="emit('view', company)" />
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Modifier" @click="emit('edit', company)" />
                  <v-divider class="my-1" />
                  <v-list-item
                    :prepend-icon="company.status === 'suspended' ? 'mdi-play-circle-outline' : 'mdi-pause-circle-outline'"
                    :title="company.status === 'suspended' ? 'Réactiver' : 'Suspendre'"
                    :class="company.status === 'suspended' ? 'text-success' : 'text-error'"
                    @click="emit('changeStatus', company)"
                  />
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <AppEmptyState v-else icon="mdi-domain-off" title="Aucune entreprise trouvée" description="Modifiez votre recherche ou vos filtres pour afficher d’autres résultats." />

    <AppTableFooter
      v-if="filteredCompanies.length"
      :page="page"
      :page-count="pageCount"
      :start="pageStart + 1"
      :end="Math.min(pageStart + pageSize, filteredCompanies.length)"
      :total="filteredCompanies.length"
      label="entreprises"
      @update:page="page = $event"
    />
  </v-card>
</template>
