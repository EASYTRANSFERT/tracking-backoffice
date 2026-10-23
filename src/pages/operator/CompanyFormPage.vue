<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import CompanyForm from '@/Components/companies/CompanyForm.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { CompanyInput } from '@/types/operator'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const feedback = useUiFeedbackStore()
const { offers } = storeToRefs(store)
const companyId = computed(() => route.params.companyId as string | undefined)
const company = computed(() => companyId.value ? store.getCompanyById(companyId.value) : undefined)
const isEditing = computed(() => Boolean(companyId.value))
const isDirty = ref(false)

onBeforeRouteLeave(async () => !isDirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette entreprise seront perdues.', confirmText: 'Quitter' }))

async function submit(payload: CompanyInput) {
  try {
    isDirty.value = false
    if (companyId.value) {
      await store.updateCompany(companyId.value, payload)
      feedback.success('Entreprise mise à jour.')
      await router.push({ name: 'company-details', params: { companyId: companyId.value }, query: { updated: '1' } })
      return
    }
    const id = await store.createCompany(payload)
    feedback.success('Entreprise créée.')
    await router.push({ name: 'company-details', params: { companyId: id }, query: { created: '1' } })
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cette entreprise.'))
  }
}

function cancel() {
  isDirty.value = false
  router.back()
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader>
      <template #title>{{ isEditing ? 'Modifier l’entreprise' : 'Nouvelle entreprise' }}</template>
      <template #description>{{ isEditing ? 'Mettez à jour les informations et l’offre attribuée.' : 'Renseignez les informations nécessaires à la création du compte client.' }}</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'companies' }">Retour aux entreprises</v-btn></template>
    </PageHeader>

    <v-alert v-if="isEditing && !company" type="error" variant="tonal" title="Entreprise introuvable" text="Cette entreprise n’existe pas ou n’est plus disponible." />
    <CompanyForm v-else :company="company" :offers="offers" @submit="submit" @cancel="cancel" @dirty-change="isDirty = $event" />
  </div>
</template>
