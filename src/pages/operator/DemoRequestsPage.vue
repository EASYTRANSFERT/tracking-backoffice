<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import DemoRequestDetailsDialog from '@/Components/demo-requests/DemoRequestDetailsDialog.vue'
import DemoRequestTable from '@/Components/demo-requests/DemoRequestTable.vue'
import { demoRequestStatusConfig, demoRequestStatusOptions } from '@/Components/demo-requests/demo-request-format'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { apiErrorCode, getApiErrorMessage } from '@/utils/api-error'
import { useAuthStore } from '@/stores/auth.store'
import { DEMO_REQUEST_PAGE_SIZES, useDemoRequestStore } from '@/stores/demo-request.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { DemoRequestResponse, DemoRequestStatus, UpdateDemoRequestRequest } from '@/types/demo-request'

const store = useDemoRequestStore()
const authStore = useAuthStore()
const feedback = useUiFeedbackStore()
const { requests, page, pageSize, hasNext, hasPrevious, isLoading, isSaving } = storeToRefs(store)

// Les filtres de la dernière visite sont repris.
const status = ref<DemoRequestStatus | null>(store.filters.status ?? null)
const search = ref<string | null>(store.filters.q ?? null)
const selectedId = ref<string | null>(null)
/** Toujours la version de la liste, mise à jour par le store après lecture ou enregistrement. */
const selected = computed(() => requests.value.find((request) => request.id === selectedId.value) ?? null)

const activeFilterCount = computed(() => [status, search].filter((field) => field.value).length)
const statusChips = computed(() => demoRequestStatusOptions.map((option) => ({ ...option, ...demoRequestStatusConfig(option.value) })))

const actorName = (actorId?: string) => {
  if (!actorId) return 'Système'
  return actorId === authStore.currentUser?.id ? 'Vous' : 'Un opérateur'
}

async function load() {
  try {
    await store.loadRequests({ status: status.value ?? undefined, q: search.value?.trim().slice(0, 100) || undefined })
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les demandes de démo.'))
  }
}
async function changePage(direction: 'next' | 'previous') {
  try { await (direction === 'next' ? store.nextPage() : store.previousPage()) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger cette page.')) }
}
async function changePageSize(size: number) {
  try { await store.loadRequests(store.filters, size) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les demandes de démo.')) }
}

function resetFilters() {
  status.value = search.value = null
}

async function open(request: DemoRequestResponse) {
  selectedId.value = request.id
  // L'historique peut avoir bougé depuis le chargement de la liste (autre opérateur).
  try { await store.fetchRequest(request.id) } catch { /* la version de la liste reste affichée */ }
}

async function save(payload: UpdateDemoRequestRequest) {
  if (!selectedId.value) return
  try {
    await store.updateRequest(selectedId.value, payload)
    feedback.success('Demande mise à jour.')
  } catch (error) {
    if (apiErrorCode(error) === 'NOT_FOUND') {
      feedback.error('Cette demande n’existe plus.')
      selectedId.value = null
      void load()
    } else {
      feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer la demande.'))
    }
  }
}

// La recherche part après une courte pause de saisie.
let debounce: ReturnType<typeof setTimeout> | undefined
watch([status, search], () => {
  clearTimeout(debounce)
  debounce = setTimeout(load, 350)
})
onBeforeUnmount(() => clearTimeout(debounce))

onMounted(load)
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Demandes de démo</template>
      <template #description>Les prospects qui ont demandé une démonstration depuis le site. Les plus récentes d’abord.</template>
      <template #actions>
        <v-btn variant="outlined" color="secondary" prepend-icon="mdi-refresh" :loading="isLoading" @click="load">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5">
        <div class="flex flex-wrap items-center gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#252830]">Demandes reçues</h2>
            <p class="mt-1 text-xs text-[#747985]">Cliquez sur une ligne pour suivre la demande : statut, date de la démo, notes internes.</p>
          </div>
          <v-spacer />
          <v-btn v-if="activeFilterCount" variant="text" color="secondary" size="small" prepend-icon="mdi-filter-remove-outline" @click="resetFilters">
            Effacer les filtres ({{ activeFilterCount }})
          </v-btn>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <v-text-field
            v-model="search"
            label="Rechercher"
            placeholder="Nom, entreprise ou adresse"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            maxlength="100"
            hide-details
            clearable
            class="lg:max-w-sm"
          />
          <div class="flex flex-wrap items-center gap-2">
            <v-chip
              v-for="chip in statusChips"
              :key="chip.value"
              :color="status === chip.value ? chip.color : undefined"
              :variant="status === chip.value ? 'flat' : 'outlined'"
              :prepend-icon="chip.icon"
              size="small"
              @click="status = status === chip.value ? null : chip.value"
            >
              {{ chip.title }}
            </v-chip>
          </div>
        </div>
      </div>
      <v-divider />
      <v-progress-linear v-if="isLoading" indeterminate color="primary" />
      <DemoRequestTable v-if="requests.length" :requests="requests" @view="open" />
      <AppEmptyState
        v-else-if="!isLoading"
        icon="mdi-presentation"
        title="Aucune demande trouvée"
        :description="activeFilterCount ? 'Aucune demande ne correspond à ces filtres.' : 'Les demandes envoyées depuis le site apparaîtront ici.'"
      />
      <AppTableFooter
        v-if="requests.length || hasPrevious"
        mode="cursor"
        :page="page"
        :page-count="1"
        :start="1"
        :end="requests.length"
        label="demandes"
        :has-next="hasNext && !isLoading"
        :has-previous="hasPrevious && !isLoading"
        :page-size="pageSize"
        :page-size-options="DEMO_REQUEST_PAGE_SIZES"
        @next="changePage('next')"
        @previous="changePage('previous')"
        @update:page-size="changePageSize"
      />
    </v-card>

    <DemoRequestDetailsDialog
      :request="selected"
      :saving="isSaving"
      :actor-name="actorName"
      @close="selectedId = null"
      @save="save"
    />
  </div>
</template>
