<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import OfferTable from '@/Components/offers/OfferTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'

const router = useRouter()
const store = useOperatorStore()
const { offers } = storeToRefs(store)
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Offres</template>
      <template #description>Configurez les formules commerciales proposées aux entreprises.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'offer-create' }">Nouvelle offre</v-btn></template>
    </PageHeader>
    <OfferTable
      :offers="offers"
      @view="router.push({ name: 'offer-details', params: { offerId: $event.id } })"
      @edit="router.push({ name: 'offer-edit', params: { offerId: $event.id } })"
    />
  </div>
</template>
