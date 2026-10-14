<script setup lang="ts">
import { computed } from 'vue'
import type { Company, Offer } from '@/types/operator'

const props = defineProps<{
  companies: Company[]
  offers: Offer[]
}>()

const colors = ['primary', 'secondary', 'grey-lighten-1', 'grey-lighten-2']

const distribution = computed(() => {
  const items = props.offers
    .filter((offer) => offer.status === 'active')
    .map((offer, index) => ({
      id: offer.id,
      name: offer.name,
      count: props.companies.filter((company) => company.offerId === offer.id).length,
      color: colors[index % colors.length],
    }))
    .filter((item) => item.count > 0)

  const maximum = Math.max(...items.map((item) => item.count), 1)
  return items.map((item) => ({ ...item, percentage: (item.count / maximum) * 100 }))
})
</script>

<template>
  <v-card class="h-full">
    <v-card-title class="px-6 py-5">
      <h2 class="text-lg font-bold text-[#252830]">Répartition des offres</h2>
      <p class="mt-1 text-xs font-normal text-[#848484]">Entreprises de la page chargée par formule</p>
    </v-card-title>

    <v-divider />

    <v-card-text class="space-y-6 px-6 py-6">
      <div v-for="item in distribution" :key="item.id">
        <div class="mb-2 flex justify-between text-sm">
          <span>{{ item.name }}</span>
          <strong>{{ item.count }}</strong>
        </div>
        <v-progress-linear :model-value="item.percentage" :color="item.color" height="8" rounded />
      </div>

      <p v-if="!distribution.length" class="py-6 text-center text-sm text-[#848484]">
        Aucune offre attribuée sur cette page.
      </p>
    </v-card-text>
  </v-card>
</template>
