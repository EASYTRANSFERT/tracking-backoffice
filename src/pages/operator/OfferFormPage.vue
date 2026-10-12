<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import OfferForm from '@/Components/offers/OfferForm.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'
import type { OfferInput } from '@/types/operator'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const offerId = computed(() => route.params.offerId as string | undefined)
const offer = computed(() => offerId.value ? store.getOfferById(offerId.value) : undefined)
const isEditing = computed(() => Boolean(offerId.value))
const isDirty = ref(false)

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('Des modifications ne sont pas enregistrées. Voulez-vous vraiment quitter cette page ?')
})

function submit(payload: OfferInput) {
  isDirty.value = false
  if (offerId.value) {
    store.updateOffer(offerId.value, payload)
    void router.push({ name: 'offer-details', params: { offerId: offerId.value }, query: { updated: '1' } })
    return
  }
  const id = store.createOffer(payload)
  void router.push({ name: 'offer-details', params: { offerId: id }, query: { created: '1' } })
}

function cancel() {
  isDirty.value = false
  router.back()
}
</script>

<template>
  <div class="mx-auto w-full max-w-[900px]">
    <PageHeader>
      <template #title>{{ isEditing ? 'Modifier l’offre' : 'Nouvelle offre' }}</template>
      <template #description>{{ isEditing ? 'Mettez à jour les paramètres de cette formule.' : 'Créez une nouvelle formule pour les entreprises clientes.' }}</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'offers' }">Retour aux offres</v-btn></template>
    </PageHeader>
    <v-alert v-if="isEditing && !offer" type="error" variant="tonal" title="Offre introuvable" text="Cette offre n’existe pas ou n’est plus disponible." />
    <OfferForm v-else :offer="offer" @submit="submit" @cancel="cancel" @dirty-change="isDirty = $event" />
  </div>
</template>
