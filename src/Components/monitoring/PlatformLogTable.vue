<script setup lang="ts">
import { computed, ref } from 'vue'
import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import type { PlatformActivity } from '@/types/operator'

const props = withDefaults(defineProps<{ activities: PlatformActivity[]; pageSize?: number }>(), { pageSize: 5 })
const category = ref<PlatformActivity['category'] | 'all'>('all')
const date = ref('')
const categoryIcon = { company: 'mdi-domain', offer: 'mdi-cash-multiple', support: 'mdi-lifebuoy', system: 'mdi-server' }
const categoryLabel = { company: 'Entreprise', offer: 'Offre', support: 'Support', system: 'Système' }
const categoryItems = [{ title: 'Toutes les catégories', value: 'all' }, { title: 'Entreprises', value: 'company' }, { title: 'Offres', value: 'offer' }, { title: 'Support', value: 'support' }, { title: 'Système', value: 'system' }]
const filtered = computed(() => props.activities.filter((activity) => (category.value === 'all' || activity.category === category.value) && (!date.value || activity.createdAt.slice(0, 10) === date.value)))
const columns: AppDataTableColumn[] = [
  { key: 'event', title: 'Événement' },
  { key: 'category', title: 'Catégorie' },
  { key: 'createdAt', title: 'Date', cellClass: 'whitespace-nowrap text-sm' },
]
</script>

<template>
  <AppDataTable
    :items="filtered"
    :columns="columns"
    :page-size="pageSize"
    :reset-on="[category, date]"
    title="Journaux de la plateforme"
    subtitle="Événements agrégés, filtrables et paginés."
    label="journaux"
    header-class="md:flex-row md:items-center"
    empty-icon="mdi-text-box-search-outline"
    empty-title="Aucun journal trouvé"
    empty-description="Modifiez la date ou la catégorie."
  >
    <template #filters>
      <div class="grid gap-3 sm:grid-cols-2">
        <v-select v-model="category" :items="categoryItems" density="compact" hide-details />
        <v-text-field v-model="date" type="date" label="Date" density="compact" hide-details clearable />
      </div>
    </template>
    <template #cell-event="{ item: activity }">
      <div class="flex min-h-16 items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon :icon="categoryIcon[activity.category]" color="primary" /></v-avatar>
        <div><p class="font-semibold">{{ activity.title }}</p><p class="text-xs text-[#747985]">{{ activity.description }}</p></div>
      </div>
    </template>
    <template #cell-category="{ item: activity }"><v-chip variant="tonal" color="primary">{{ categoryLabel[activity.category] }}</v-chip></template>
    <template #cell-createdAt="{ item: activity }">{{ new Date(activity.createdAt).toLocaleString('fr-FR') }}</template>
  </AppDataTable>
</template>
