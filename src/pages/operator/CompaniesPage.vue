<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import CompanyTable from '@/Components/CompanyTable.vue'
import CompanyStatusDialog from '@/Components/companies/CompanyStatusDialog.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Company } from '@/types/operator'

const router = useRouter()
const store = useOperatorStore()
const feedback = useUiFeedbackStore()
const { companies, offers, companyPage, companyNextCursor, companyCursorHistory } = storeToRefs(store)
const selectedCompany = ref<Company>()
const statusDialog = ref(false)

function openStatusDialog(company: Company) {
  selectedCompany.value = company
  statusDialog.value = true
}

async function updateStatus(reason: string) {
  if (!selectedCompany.value) return
  const previousStatus = selectedCompany.value.status
  try {
    if (previousStatus === 'active') await store.suspendCompany(selectedCompany.value.id, reason)
    else await store.reactivateCompany(selectedCompany.value.id)
    feedback.success(previousStatus === 'active' ? 'Entreprise suspendue.' : 'Entreprise activée.')
  } catch (error) {
    feedback.error(error instanceof Error ? error.message : 'Impossible de modifier le statut de cette entreprise.')
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Entreprises</template>
      <template #description>Créez, consultez et gérez les entreprises clientes.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'company-create' }">Nouvelle entreprise</v-btn></template>
    </PageHeader>

    <CompanyTable
      :companies="companies"
      :offers="offers"
      :cursor-page="companyPage"
      :has-next-page="Boolean(companyNextCursor)"
      :has-previous-page="companyCursorHistory.length > 0"
      @view="router.push({ name: 'company-details', params: { companyId: $event.id } })"
      @edit="router.push({ name: 'company-edit', params: { companyId: $event.id } })"
      @change-status="openStatusDialog"
      @next-page="store.nextCompanyPage"
      @previous-page="store.previousCompanyPage"
    />

    <CompanyStatusDialog
      v-if="selectedCompany"
      v-model="statusDialog"
      :company-name="selectedCompany.legalName"
      :status="selectedCompany.status"
      @confirm="updateStatus"
    />
  </div>
</template>
