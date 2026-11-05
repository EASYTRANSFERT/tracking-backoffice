<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import { usePagination } from '@/composables/usePagination'
import type { PlatformActivity } from '@/types/operator'
const props = withDefaults(defineProps<{ activities: PlatformActivity[]; pageSize?: number }>(), { pageSize: 5 })
const category = ref<PlatformActivity['category'] | 'all'>('all'); const date = ref('')
const categoryIcon = { company: 'mdi-domain', offer: 'mdi-cash-multiple', support: 'mdi-lifebuoy', system: 'mdi-server' }
const categoryLabel = { company: 'Entreprise', offer: 'Offre', support: 'Support', system: 'Système' }
const filtered = computed(() => props.activities.filter((activity) => (category.value === 'all' || activity.category === category.value) && (!date.value || activity.createdAt.slice(0, 10) === date.value)))
const { page, pageCount, start, end, displayed } = usePagination(filtered, () => props.pageSize)
watch([category, date], () => { page.value = 1 })
</script>
<template><v-card class="overflow-hidden"><div class="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center"><div><h2 class="text-lg font-bold">Journaux de la plateforme</h2><p class="mt-1 text-xs text-[#747985]">Événements agrégés, filtrables et paginés.</p></div><v-spacer /><div class="grid gap-3 sm:grid-cols-2"><v-select v-model="category" :items="[{title:'Toutes les catégories',value:'all'},{title:'Entreprises',value:'company'},{title:'Offres',value:'offer'},{title:'Support',value:'support'},{title:'Système',value:'system'}]" density="compact" hide-details /><v-text-field v-model="date" type="date" label="Date" density="compact" hide-details clearable /></div></div><v-divider /><div v-if="displayed.length" class="overflow-x-auto"><v-table hover><thead><tr><th>Événement</th><th>Catégorie</th><th>Date</th></tr></thead><tbody><tr v-for="activity in displayed" :key="activity.id"><td><div class="flex min-h-16 items-center gap-3"><v-avatar color="red-lighten-5" rounded="lg"><v-icon :icon="categoryIcon[activity.category]" color="primary" /></v-avatar><div><p class="font-semibold">{{ activity.title }}</p><p class="text-xs text-[#747985]">{{ activity.description }}</p></div></div></td><td><v-chip variant="tonal" color="primary">{{ categoryLabel[activity.category] }}</v-chip></td><td class="whitespace-nowrap text-sm">{{ new Date(activity.createdAt).toLocaleString('fr-FR') }}</td></tr></tbody></v-table></div><AppEmptyState v-else icon="mdi-text-box-search-outline" title="Aucun journal trouvé" description="Modifiez la date ou la catégorie." /><AppTableFooter v-if="filtered.length" v-model:page="page" :page-count="pageCount" :start="start + 1" :end="end" :total="filtered.length" label="journaux" /></v-card></template>
