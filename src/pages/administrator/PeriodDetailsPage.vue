<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDateTime } from '@/Components/attendance/attendance-labels'
import AppErrorState from '@/Components/common/AppErrorState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import PeriodBilan from '@/Components/periods/PeriodBilan.vue'
import PeriodCloseDialog from '@/Components/periods/PeriodCloseDialog.vue'
import PeriodReopenDialog from '@/Components/periods/PeriodReopenDialog.vue'
import PeriodStateChip from '@/Components/periods/PeriodStateChip.vue'
import { usePeriodAccess } from '@/composables/usePeriodAccess'
import { useUserDisplay } from '@/composables/useUserDisplay'
import { useAdministratorStore } from '@/stores/administrator.store'
import { CLOSURE_POLL_INTERVAL_MS, usePeriodStore } from '@/stores/period.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { apiErrorCode, formatPeriodRange, periodErrorMessage, readClosureBlockers } from '@/utils/period-format'
import type { PeriodBlockers } from '@/types/period'

const route = useRoute()
const router = useRouter()
const store = usePeriodStore()
const { readonly, listRoute } = usePeriodAccess()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()

// Onglet choisi dans l'URL (?tab=bilan), pour qu'un lien puisse y mener.
const tab = computed({
  get: () => (route.query.tab === 'bilan' ? 'bilan' : 'suivi'),
  set: (value: string) => { void router.replace({ query: { ...route.query, tab: value } }) },
})
const periodId = computed(() => route.params.periodId as string)
const period = computed(() => store.findPeriod(periodId.value))
const loadError = ref<string | null>(null)

// L'API n'accepte la réouverture que d'une période en validation (IN_VALIDATION → OPEN).
const canReopen = computed(() => period.value?.state === 'IN_VALIDATION')
const canClose = computed(() => period.value?.state === 'IN_VALIDATION')
const blockers = computed<PeriodBlockers | null>(() => closeBlockers.value ?? period.value?.blockers ?? null)
const blockedCount = computed(() => (blockers.value?.pending ?? 0) + (blockers.value?.open ?? 0))
const { userName } = useUserDisplay()

const reopenOpen = ref(false)
const reopenError = ref<string | null>(null)
const closeOpen = ref(false)
const closeForced = ref(false)
const closeError = ref<string | null>(null)
const closeBlockers = ref<PeriodBlockers | null>(null)
const stepUpDone = ref(false)

async function load() {
  loadError.value = null
  try {
    const loaded = await store.loadPeriod(periodId.value)
    const ids = [loaded.createdBy, loaded.reopenedBy, loaded.closeRequestedBy, loaded.closedBy].filter((id): id is string => Boolean(id))
    administratorStore.ensureUsers(ids).catch(() => undefined)
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Impossible de charger cette période.')
  }
}

// Clôture en cours : on suit la période jusqu'à ce qu'elle soit close (ou revenue en validation).
// Pendant une clôture lancée depuis cette page, c'est le store qui interroge : on ne double pas les appels.
let timer: ReturnType<typeof setInterval> | undefined
watch(() => period.value?.state, (state) => {
  clearInterval(timer)
  if (state === 'CLOSING') timer = setInterval(() => { if (!store.isSaving) store.loadPeriod(periodId.value).catch(() => undefined) }, CLOSURE_POLL_INTERVAL_MS)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
onMounted(load)

function openReopen() { reopenError.value = null; reopenOpen.value = true }

async function reopen(reason: string) {
  reopenError.value = null
  try {
    await store.reopenPeriod(periodId.value, reason)
    feedback.success('Période rouverte.')
    reopenOpen.value = false
  } catch (error) {
    reopenError.value = periodErrorMessage(error) ?? getApiErrorMessage(error, 'Impossible de rouvrir la période.')
  }
}

function openClose(forced = false) {
  closeForced.value = forced
  closeError.value = null
  closeBlockers.value = null
  stepUpDone.value = false
  closeOpen.value = true
}

async function close(payload: { code?: string; force: boolean; reason?: string }) {
  closeError.value = null
  try {
    const result = await store.closePeriod(periodId.value, { force: payload.force || undefined, reason: payload.reason }, payload.code)
    closeOpen.value = false
    closeBlockers.value = null
    if (result.state === 'CLOSED') feedback.success('Période clôturée.')
    else if (result.state === 'IN_VALIDATION') feedback.warning('La clôture a été interrompue : des sessions sont à valider.')
    else feedback.success('Clôture en cours : les totaux sont en cours de calcul.')
  } catch (error) {
    const refused = readClosureBlockers(error)
    if (refused) {
      // Refus RG-17 : le step-up a réussi, on propose de forcer sans redemander le code.
      closeBlockers.value = refused
      stepUpDone.value = true
      closeError.value = null
    } else {
      const code = apiErrorCode(error)
      if (code === 'STEP_UP_REQUIRED') stepUpDone.value = false
      // L'état affiché n'était plus à jour : on recharge la période pour refléter son état réel.
      if (code === 'PERIOD_INVALID_TRANSITION' || code === 'PERIOD_ALREADY_CLOSED') load()
      closeError.value = periodErrorMessage(error) ?? getApiErrorMessage(error, 'Impossible de clôturer la période.')
    }
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader>
      <template #title>{{ period ? `Période du ${formatPeriodRange(period)}` : 'Période' }}</template>
      <template #description>Blocages de clôture, historique et actions de la période.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: listRoute }">Retour aux périodes</v-btn></template>
    </PageHeader>

    <AppErrorState v-if="loadError && !period" title="Période introuvable" :description="loadError" />
    <v-progress-linear v-else-if="!period" indeterminate color="primary" />

    <v-tabs v-else v-model="tab" color="primary" class="mb-6">
      <v-tab value="suivi">Suivi et clôture</v-tab>
      <v-tab value="bilan">Bilan</v-tab>
    </v-tabs>
    <PeriodBilan v-if="period && tab === 'bilan'" :period-id="periodId" @show-sessions="tab = 'suivi'" />

    <div v-else-if="period" class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div class="space-y-6">
        <v-card v-if="period.state !== 'CLOSED'">
          <v-card-title class="px-6 py-5">Blocages de clôture</v-card-title>
          <v-divider />
          <v-card-text class="space-y-4 px-6 py-6">
            <v-alert v-if="period.state === 'OPEN'" type="info" variant="tonal" density="compact" text="La période n’est pas encore terminée : elle passera d’elle-même en validation après sa dernière journée." />
            <v-alert v-if="period.state === 'CLOSING'" type="info" variant="tonal" density="compact" text="Clôture en cours : les sessions sont rattachées et les totaux figés." />
            <template v-if="blockers">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg border border-[#eceef2] px-4 py-3">
                  <p class="text-xs text-[#848484]">En attente de décision</p>
                  <p class="mt-1 text-2xl font-bold tabular-nums" :class="blockers.pending ? 'text-[#D80F16]' : 'text-[#1E7D4F]'">{{ blockers.pending }}</p>
                </div>
                <div class="rounded-lg border border-[#eceef2] px-4 py-3">
                  <p class="text-xs text-[#848484]">Encore ouvertes (sortie non pointée)</p>
                  <p class="mt-1 text-2xl font-bold tabular-nums" :class="blockers.open ? 'text-[#D80F16]' : 'text-[#1E7D4F]'">{{ blockers.open }}</p>
                </div>
              </div>
              <v-alert v-if="!blockedCount" type="success" variant="tonal" density="compact" text="Aucun blocage : la période peut être clôturée." />
              <div v-else class="space-y-2">
                <p class="text-sm text-[#535865]">Sessions à traiter depuis la page de leur mission (premières concernées) :</p>
                <div class="flex flex-wrap gap-2"><v-chip v-for="id in blockers.sampleSessionIds" :key="id" size="small" variant="outlined" class="font-mono">{{ id }}</v-chip></div>
              </div>
            </template>
            <v-alert v-if="period.lastClosureFailure" type="warning" variant="tonal" density="compact">
              La dernière clôture a échoué le {{ formatDateTime(period.lastClosureFailure.at) }} : {{ period.lastClosureFailure.pending }} session(s) en attente et {{ period.lastClosureFailure.open }} ouverte(s).
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="px-6 py-5">Historique</v-card-title>
          <v-divider />
          <v-timeline density="compact" side="end" class="px-6 py-6">
            <v-timeline-item dot-color="primary" size="x-small"><p class="text-sm"><strong>Créée</strong> par {{ userName(period.createdBy) }}</p></v-timeline-item>
            <v-timeline-item v-if="period.validationStartedAt" dot-color="warning" size="x-small"><p class="text-sm"><strong>Validation ouverte</strong> le {{ formatDateTime(period.validationStartedAt) }}</p></v-timeline-item>
            <v-timeline-item v-if="period.reopenedAt" dot-color="warning" size="x-small">
              <p class="text-sm"><strong>Rouverte</strong> le {{ formatDateTime(period.reopenedAt) }} par {{ userName(period.reopenedBy) }}</p>
              <p v-if="period.reopenReason" class="mt-1 text-sm text-[#535865]">« {{ period.reopenReason }} »</p>
            </v-timeline-item>
            <v-timeline-item v-if="period.closeRequestedAt" dot-color="secondary" size="x-small"><p class="text-sm"><strong>Clôture demandée</strong> le {{ formatDateTime(period.closeRequestedAt) }} par {{ userName(period.closeRequestedBy) }}</p></v-timeline-item>
            <v-timeline-item v-if="period.closedAt" dot-color="success" size="x-small">
              <p class="text-sm"><strong>Clôturée</strong> le {{ formatDateTime(period.closedAt) }} par {{ userName(period.closedBy) }}</p>
              <template v-if="period.forced">
                <p class="mt-1 text-sm text-[#B00C12]">Clôture forcée : {{ period.unvalidatedCount ?? 0 }} session(s) figées sans décision, hors des totaux.</p>
                <p v-if="period.forceReason" class="mt-1 text-sm text-[#535865]">« {{ period.forceReason }} »</p>
              </template>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </div>

      <v-card class="h-fit">
        <v-card-text class="pa-6">
          <div class="flex items-center justify-between"><span class="font-bold">État</span><PeriodStateChip :state="period.state" /></div>
          <v-progress-linear v-if="period.state === 'CLOSING'" indeterminate color="primary" class="mt-4" />
          <v-divider class="my-5" />
          <div v-if="!readonly" class="space-y-3">
            <v-btn block color="primary" variant="flat" prepend-icon="mdi-lock-check-outline" :disabled="!canClose" @click="openClose(false)">Clôturer la période</v-btn>
            <v-btn block variant="tonal" color="error" prepend-icon="mdi-lock-alert-outline" :disabled="!canClose" @click="openClose(true)">Forcer la clôture</v-btn>
            <v-btn v-if="canReopen" block variant="tonal" color="warning" prepend-icon="mdi-lock-open-variant-outline" @click="openReopen">Rouvrir pour correction</v-btn>
          </div>
          <p v-if="readonly" class="mt-4 text-xs leading-5 text-[#747985]">La clôture et la réouverture d’une période sont réservées à l’administrateur.</p>
          <p v-else class="mt-4 text-xs leading-5 text-[#747985]">
            <template v-if="period.state === 'CLOSED'">Une période clôturée est immuable : elle ne se rouvre jamais.</template>
            <template v-else-if="period.state === 'IN_VALIDATION'">La clôture demande votre code TOTP. Elle est refusée tant que des sessions sont en attente ou ouvertes, sauf clôture forcée avec motif. La réouverture, avec motif, remet la période en « Ouverte ».</template>
            <template v-else-if="period.state === 'CLOSING'">Clôture en cours : la page se met à jour jusqu’à la fin du calcul des totaux.</template>
            <template v-else>La clôture (simple ou forcée) et la réouverture sont disponibles une fois la période terminée et passée en validation.</template>
          </p>
        </v-card-text>
      </v-card>
    </div>

    <PeriodReopenDialog v-if="!readonly" v-model="reopenOpen" :loading="store.isSaving" :error-message="reopenError" @submit="reopen" />
    <PeriodCloseDialog v-if="!readonly" :period="closeOpen ? period ?? null : null" :blockers="blockers" :step-up-done="stepUpDone" :forced="closeForced" :loading="store.isSaving" :error-message="closeError" @submit="close" @cancel="closeOpen = false" />
  </div>
</template>
