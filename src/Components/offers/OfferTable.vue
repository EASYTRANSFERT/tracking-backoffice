<script setup lang="ts">
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { Offer } from '@/types/operator'

withDefaults(defineProps<{ offers: Offer[]; editable?: boolean; pageSize?: number }>(), { editable: true, pageSize: 8 })
const emit = defineEmits<{ view: [offer: Offer]; edit: [offer: Offer] }>()

const columns: AppDataTableColumn[] = [
  { key: 'name', title: 'Offre' },
  { key: 'code', title: 'Code', cellClass: 'font-semibold text-[#252830]' },
  { key: 'maxActiveAgents', title: 'Agents maximum' },
  { key: 'status', title: 'Statut' },
  { key: 'actions', title: 'Actions', class: 'w-16', srOnly: true },
]
</script>

<template>
  <AppDataTable
    :items="offers"
    :columns="columns"
    :page-size="pageSize"
    :search-text="(offer) => [offer.name]"
    search-placeholder="Rechercher une offre"
    title="Catalogue des offres"
    subtitle="Formules commerciales disponibles pour les entreprises"
    label="offres"
    table-class="min-w-[720px]"
    clickable
    empty-icon="mdi-cash-remove"
    empty-title="Aucune offre trouvée"
    empty-description="Aucune formule ne correspond à votre recherche."
    @click:row="emit('view', $event)"
  >
    <template #cell-name="{ item: offer }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-cash-multiple" color="primary" /></v-avatar>
        <div>
          <p class="font-semibold text-[#252830]">{{ offer.name }}</p>
          <p class="max-w-[300px] truncate text-xs text-[#848484]">{{ offer.description }}</p>
        </div>
      </div>
    </template>
    <template #cell-status="{ item: offer }"><div class="flex min-h-16 items-center"><AppStatusChip :status="offer.status" /></div></template>
    <template #cell-actions="{ item: offer }">
      <div @click.stop><v-btn v-if="editable" icon="mdi-pencil-outline" variant="text" size="small" aria-label="Modifier" @click="emit('edit', offer)" /></div>
    </template>
  </AppDataTable>
</template>
