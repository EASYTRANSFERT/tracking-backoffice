<script setup lang="ts">
import { computed, ref } from 'vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { Offer } from '@/types/operator'

const props = withDefaults(defineProps<{ offers: Offer[]; editable?: boolean }>(), { editable: true })
const emit = defineEmits<{ view: [offer: Offer]; edit: [offer: Offer] }>()
const search = ref('')
const filteredOffers = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  return props.offers.filter((offer) => !query || offer.name.toLocaleLowerCase('fr').includes(query))
})
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
      <div><h2 class="text-lg font-bold text-[#252830]">Catalogue des offres</h2><p class="mt-1 text-xs text-[#747985]">Formules commerciales disponibles pour les entreprises</p></div>
      <v-spacer />
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher une offre" density="compact" hide-details clearable class="w-full sm:max-w-[280px]" />
    </div>
    <v-divider />

    <div v-if="filteredOffers.length" class="overflow-x-auto">
      <v-table hover class="min-w-[720px]">
        <thead><tr><th>Offre</th><th>Code</th><th>Agents maximum</th><th>Entreprises</th><th>Statut</th><th class="w-16"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="offer in filteredOffers" :key="offer.id" class="cursor-pointer" @click="emit('view', offer)">
            <td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-cash-multiple" color="primary" /></v-avatar><div><p class="font-semibold text-[#252830]">{{ offer.name }}</p><p class="max-w-[300px] truncate text-xs text-[#848484]">{{ offer.description }}</p></div></div></td>
            <td class="font-semibold text-[#252830]">{{ offer.code }}</td>
            <td>{{ offer.maxActiveAgents }}</td>
            <td>{{ offer.companyCount }}</td>
            <td><div class="flex min-h-16 items-center"><AppStatusChip :status="offer.status" /></div></td>
            <td @click.stop><v-btn v-if="editable" icon="mdi-pencil-outline" variant="text" size="small" aria-label="Modifier" @click="emit('edit', offer)" /></td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else icon="mdi-cash-remove" title="Aucune offre trouvée" description="Aucune formule ne correspond à votre recherche." />
  </v-card>
</template>
