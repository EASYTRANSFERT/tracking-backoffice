<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import PeriodCreateDialog from '@/Components/periods/PeriodCreateDialog.vue'
import PeriodTable from '@/Components/periods/PeriodTable.vue'
import { usePeriodStore } from '@/stores/period.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { periodErrorMessage, periodStateOptions } from '@/utils/period-format'
import type { ApiPeriodState, PeriodResponse } from '@/types/period'

const router = useRouter()
const store = usePeriodStore()
const feedback = useUiFeedbackStore()
const { periods, isLoading, isSaving } = storeToRefs(store)

const state = ref<ApiPeriodState | null>(null)
const filtered = computed(() => periods.value.filter((period) => !state.value || period.state === state.value))
const createOpen = ref(false)
const createError = ref<string | null>(null)

onMounted(async () => {
  try { await store.loadPeriods(true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les périodes.')) }
})

const view = (period: PeriodResponse) => router.push({ name: 'admin-period-details', params: { periodId: period.id } })

function openCreate() {
  createError.value = null
  createOpen.value = true
}

async function create(from: string, to: string) {
  createError.value = null
  try {
    const created = await store.createPeriod(from, to)
    feedback.success('Période créée.')
    createOpen.value = false
    void view(created)
  } catch (error) {
    createError.value = periodErrorMessage(error) ?? getApiErrorMessage(error, 'Impossible de créer la période.')
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Périodes</template>
      <template #description>Validez les pointages d’une période, puis clôturez-la pour figer les totaux.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-calendar-plus" size="large" @click="openCreate">Nouvelle période</v-btn></template>
    </PageHeader>
    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-4" />
    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        <div>
          <h2 class="text-lg font-bold text-[#252830]">Périodes de validation</h2>
          <p class="mt-1 text-xs text-[#747985]">Ouverte, puis en validation une fois la dernière journée écoulée, puis clôturée (définitif).</p>
        </div>
        <v-spacer />
        <v-select v-model="state" :items="periodStateOptions" placeholder="Tous les états" density="compact" hide-details clearable class="lg:max-w-[240px]" />
      </div>
      <v-divider />
      <PeriodTable v-if="filtered.length" :periods="filtered" @view="view" />
      <AppEmptyState v-else-if="!isLoading" icon="mdi-calendar-blank-outline" title="Aucune période" description="Créez une période pour valider puis clôturer les pointages de l’entreprise.">
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-calendar-plus" @click="openCreate">Nouvelle période</v-btn>
      </AppEmptyState>
    </v-card>
    <PeriodCreateDialog v-model="createOpen" :loading="isSaving" :error-message="createError" @submit="create" />
  </div>
</template>
