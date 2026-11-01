<script setup lang="ts">
import { useBusy } from '@/composables/useBusy'
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import OfferForm from '@/Components/offers/OfferForm.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { OfferInput } from '@/types/operator'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const feedback = useUiFeedbackStore()
const offerId = computed(() => route.params.offerId as string | undefined)
const offer = computed(() => offerId.value ? store.getOfferById(offerId.value) : undefined)
const isEditing = computed(() => Boolean(offerId.value))
const isUnsupportedEdit = computed(() => isEditing.value && !store.canUpdateOffers)
const isDirty = ref(false)
const saving = useBusy()

onBeforeRouteLeave(async () => !isDirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette offre seront perdues.', confirmText: 'Quitter' }))

async function submit(payload: OfferInput) {
  try {
    isDirty.value = false
    // Le chargement couvre l'enregistrement puis la navigation vers la page de l'offre.
    await saving.run(async () => {
      if (offerId.value) {
        store.updateOffer(offerId.value, payload)
        feedback.success('Offre mise à jour.')
        await router.push({ name: 'offer-details', params: { offerId: offerId.value }, query: { updated: '1' } })
        return
      }
      const id = await store.createOffer(payload)
      await router.push({ name: 'offer-details', params: { offerId: id }, query: { created: '1' } })
    })
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cette offre.'))
  }
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
    <v-alert v-if="isUnsupportedEdit" type="info" variant="tonal" title="Modification indisponible" text="La version actuelle de l’API ne fournit pas d’endpoint de modification d’offre." />
    <v-alert v-else-if="isEditing && !offer" type="error" variant="tonal" title="Offre introuvable" text="Cette offre n’existe pas ou n’est plus disponible." />
    <OfferForm v-else :offer="offer" :loading="saving.isBusy.value" @submit="submit" @cancel="cancel" @dirty-change="isDirty = $event" />
  </div>
</template>
