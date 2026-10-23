<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import UserForm from '@/Components/users/UserForm.vue'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { EnterpriseUserInput } from '@/types/administrator'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const feedback = useUiFeedbackStore()
const companyId = computed(() => route.params.companyId as string)
const company = computed(() => store.getCompanyById(companyId.value))
const isDirty = ref(false)
const isLoading = ref(false)

onBeforeRouteLeave(async () => {
  return !isDirty.value || await feedback.askConfirmation({
    title: 'Quitter sans enregistrer ?',
    message: 'Les informations de ce compte administrateur seront perdues.',
    confirmText: 'Quitter',
  })
})

async function submit(payload: EnterpriseUserInput) {
  if (!company.value) return

  isLoading.value = true
  try {
    await store.createCompanyAdministrator(company.value.id, payload)
    isDirty.value = false
    feedback.success('Le compte administrateur a été créé.')
    await router.push({
      name: 'company-details',
      params: { companyId: company.value.id },
      query: { adminCreated: '1' },
    })
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de créer ce compte administrateur.'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader>
      <template #title>Nouvel administrateur</template>
      <template #description>
        Créez le compte d’amorçage de {{ company?.legalName ?? 'cette entreprise' }}.
      </template>
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'company-details', params: { companyId } }">
          Retour à l’entreprise
        </v-btn>
      </template>
    </PageHeader>

    <v-alert
      v-if="!company"
      type="error"
      variant="tonal"
      title="Entreprise introuvable"
      text="Cette entreprise n’existe pas ou n’est plus disponible."
    />

    <template v-else>
      <v-alert
        class="mb-6"
        type="info"
        variant="tonal"
        title="Compte d’amorçage"
        text="Ce compte permettra au premier administrateur de se connecter à l’espace de cette entreprise."
      />
      <UserForm
        :teams="[]"
        fixed-role="administrator"
        title="Compte administrateur"
        description="Identité et accès du premier administrateur de l’entreprise"
        submit-label="Créer le compte administrateur"
        :loading="isLoading"
        @submit="submit"
        @cancel="router.back()"
        @dirty-change="isDirty = $event"
      />
    </template>
  </div>
</template>
