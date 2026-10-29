<script setup lang="ts">
import { fullName } from '@/utils/people'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'
import AuditLogDetailsDialog from '@/Components/audit/AuditLogDetailsDialog.vue'
import AuditLogTable from '@/Components/audit/AuditLogTable.vue'
import { auditActionLabel, auditOutcomeOptions, auditTargetRoute, dayBoundToIso, knownAuditActions } from '@/Components/audit/audit-format'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { addDays, toDayKey } from '@/Components/sites/site-schedule'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { AUDIT_PAGE_SIZES, useAuditStore, type AuditFilters } from '@/stores/audit.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { ApiProblemDetails } from '@/types/api'
import type { AuditLogResponse, AuditOutcome } from '@/types/audit'

const router = useRouter()
const store = useAuditStore()
const authStore = useAuthStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const { logs, page, pageSize, hasNext, hasPrevious, isLoading, seenActions, tenants } = storeToRefs(store)
const isOperator = computed(() => authStore.activeRole === 'operator')

/** Les filtres de la dernière visite sont repris : les dates ISO reviennent en jours locaux. */
const isoToDay = (value?: string) => value ? toDayKey(new Date(value)) : null
const dateFrom = ref<string | null>(isoToDay(store.filters.from))
const dateTo = ref<string | null>(isoToDay(store.filters.to))
const action = ref<string | null>(store.filters.action ?? null)
const outcome = ref<AuditOutcome | null>(store.filters.outcome ?? null)
const actorId = ref<string | null>(store.filters.actorId ?? null)
const target = ref<string | null>(store.filters.target ?? null)
const tenantId = ref<string | null>(store.filters.tenantId ?? null)
const selected = ref<AuditLogResponse | null>(null)

const periodError = computed(() => dateFrom.value && dateTo.value && dateFrom.value > dateTo.value ? 'Le début doit précéder la fin.' : '')
const activeFilterCount = computed(() => [dateFrom, dateTo, action, outcome, actorId, target, tenantId].filter((field) => field.value).length)
const actionOptions = computed(() => [...new Set([...knownAuditActions, ...seenActions.value])]
  .map((code) => ({ title: auditActionLabel(code), value: code })))
const actorOptions = computed(() => administratorStore.teamDirectoryUsers.map((user) => ({ title: fullName(user), value: user.id })))
const tenantOptions = computed(() => tenants.value.map((tenant) => ({ title: tenant.name, value: tenant.id })))

const periodPresets = [
  { label: 'Aujourd’hui', days: 0 },
  { label: '7 jours', days: 6 },
  { label: '30 jours', days: 29 },
]
function applyPreset(days: number) {
  const today = toDayKey(new Date())
  dateFrom.value = addDays(today, -days)
  dateTo.value = today
}
const isPresetActive = (days: number) => dateTo.value === toDayKey(new Date()) && dateFrom.value === addDays(toDayKey(new Date()), -days)

function actorName(log: AuditLogResponse) {
  if (!log.actorId) return 'Système'
  if (log.actorId === authStore.currentUser?.id) return 'Vous'
  const user = administratorStore.findUser(log.actorId)
  return user ? fullName(user) : log.actorId
}
const selectedTenantName = computed(() => isOperator.value && selected.value ? store.tenantName(selected.value.tenantId) : undefined)

function currentFilters(): AuditFilters {
  return {
    from: dateFrom.value ? dayBoundToIso(dateFrom.value, 'start') : undefined,
    to: dateTo.value ? dayBoundToIso(dateTo.value, 'end') : undefined,
    action: action.value?.trim().toUpperCase() || undefined,
    outcome: outcome.value ?? undefined,
    actorId: actorId.value?.trim() || undefined,
    target: target.value?.trim() || undefined,
    tenantId: isOperator.value ? tenantId.value ?? undefined : undefined,
  }
}

function showError(error: unknown, fallback: string) {
  const code = isAxiosError<ApiProblemDetails>(error) ? error.response?.data?.code : undefined
  if (code === 'VALIDATION_FAILED') feedback.error(getApiErrorMessage(error, 'Période invalide.'))
  else if (code === 'FORBIDDEN') feedback.error('Vous n’avez pas accès à ce journal.')
  else feedback.error(getApiErrorMessage(error, fallback))
}

async function load() {
  if (periodError.value) return
  try { await store.loadLogs(currentFilters()) } catch (error) { showError(error, 'Impossible de charger le journal d’audit.') }
}
async function changePage(direction: 'next' | 'previous') {
  try { await (direction === 'next' ? store.nextPage() : store.previousPage()) } catch (error) { showError(error, 'Impossible de charger cette page.') }
}
async function changePageSize(size: number) {
  try { await store.loadLogs(store.filters, size) } catch (error) { showError(error, 'Impossible de charger le journal d’audit.') }
}

function resetFilters() {
  dateFrom.value = dateTo.value = action.value = outcome.value = actorId.value = target.value = tenantId.value = null
}
function filterOn(field: 'target' | 'actorId', value: string) {
  selected.value = null
  resetFilters()
  if (field === 'target') target.value = value
  else actorId.value = value
}
function openTarget(log: AuditLogResponse) {
  const route = auditTargetRoute(log.target, authStore.activeRole)
  if (route) void router.push(route)
}

// Les champs texte déclenchent la recherche après une courte pause de saisie.
let debounce: ReturnType<typeof setTimeout> | undefined
watch([dateFrom, dateTo, action, outcome, actorId, target, tenantId], () => {
  clearTimeout(debounce)
  debounce = setTimeout(load, 350)
})
onBeforeUnmount(() => clearTimeout(debounce))

if (!isOperator.value) {
  watch(logs, (list) => { administratorStore.ensureUsers(list.map((log) => log.actorId)).catch(() => undefined) })
}

onMounted(() => {
  void load()
  if (isOperator.value) store.loadTenants().catch(() => feedback.warning('La liste des entreprises n’a pas pu être chargée.'))
  else administratorStore.loadDirectory().catch(() => feedback.warning('Les noms des auteurs n’ont pas pu être chargés.'))
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Journal d’audit</template>
      <template #description>
        {{ isOperator ? 'Toutes les actions sensibles réalisées sur la plateforme, toutes entreprises confondues.' : 'Toutes les actions sensibles réalisées dans votre entreprise.' }}
        Les plus récentes d’abord.
      </template>
      <template #actions>
        <v-btn variant="outlined" color="secondary" prepend-icon="mdi-refresh" :loading="isLoading" @click="load">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-card class="overflow-hidden">
      <div class="flex flex-col gap-4 px-5 py-5">
        <div class="flex flex-wrap items-center gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#252830]">Actions journalisées</h2>
            <p class="mt-1 text-xs text-[#747985]">Cliquez sur une ligne pour voir le détail : auteur, motif, valeurs avant et après.</p>
          </div>
          <v-spacer />
          <div class="flex flex-wrap items-center gap-2">
            <v-chip
              v-for="preset in periodPresets"
              :key="preset.days"
              :color="isPresetActive(preset.days) ? 'primary' : undefined"
              :variant="isPresetActive(preset.days) ? 'flat' : 'outlined'"
              size="small"
              @click="applyPreset(preset.days)"
            >
              {{ preset.label }}
            </v-chip>
            <v-btn v-if="activeFilterCount" variant="text" color="secondary" size="small" prepend-icon="mdi-filter-remove-outline" @click="resetFilters">
              Effacer les filtres ({{ activeFilterCount }})
            </v-btn>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <v-text-field v-model="dateFrom" type="date" label="Du" density="compact" hide-details="auto" clearable :error-messages="periodError" />
          <v-text-field v-model="dateTo" type="date" label="Au" density="compact" hide-details="auto" clearable />
          <v-combobox
            v-model="action"
            :items="actionOptions"
            :return-object="false"
            label="Action"
            placeholder="Toutes les actions"
            prepend-inner-icon="mdi-lightning-bolt-outline"
            density="compact"
            hide-details
            clearable
          />
          <v-select v-model="outcome" :items="auditOutcomeOptions" label="Résultat" placeholder="Tous" density="compact" hide-details clearable />
          <v-autocomplete
            v-if="!isOperator"
            v-model="actorId"
            :items="actorOptions"
            label="Auteur"
            placeholder="Tous les auteurs"
            prepend-inner-icon="mdi-account-search-outline"
            density="compact"
            hide-details
            clearable
          />
          <v-text-field
            v-else
            v-model="actorId"
            label="Identifiant de l’auteur"
            placeholder="usr_…"
            prepend-inner-icon="mdi-account-search-outline"
            density="compact"
            hide-details
            clearable
          />
          <v-text-field
            v-model="target"
            label="Ressource"
            placeholder="type:identifiant (ex. device:dev_…)"
            prepend-inner-icon="mdi-target"
            density="compact"
            hide-details
            clearable
          />
          <v-autocomplete
            v-if="isOperator"
            v-model="tenantId"
            :items="tenantOptions"
            label="Entreprise"
            placeholder="Toutes les entreprises"
            prepend-inner-icon="mdi-domain"
            density="compact"
            hide-details
            clearable
          />
        </div>
      </div>
      <v-divider />
      <v-progress-linear v-if="isLoading" indeterminate color="primary" />
      <AuditLogTable
        v-if="logs.length"
        :logs="logs"
        :actor-name="actorName"
        :tenant-name="store.tenantName"
        :show-tenant="isOperator && !tenantId"
        @view="selected = $event"
      />
      <AppEmptyState
        v-else-if="!isLoading"
        icon="mdi-history"
        title="Aucune action trouvée"
        :description="activeFilterCount ? 'Aucune action ne correspond à ces filtres.' : 'Les actions sensibles apparaîtront ici dès qu’elles seront réalisées.'"
      />
      <AppTableFooter
        v-if="logs.length || hasPrevious"
        mode="cursor"
        :page="page"
        :page-count="1"
        :start="1"
        :end="logs.length"
        label="actions"
        :has-next="hasNext && !isLoading"
        :has-previous="hasPrevious && !isLoading"
        :page-size="pageSize"
        :page-size-options="AUDIT_PAGE_SIZES"
        @next="changePage('next')"
        @previous="changePage('previous')"
        @update:page-size="changePageSize"
      />
    </v-card>

    <AuditLogDetailsDialog
      :log="selected"
      :actor-name="selected ? actorName(selected) : ''"
      :tenant-name="selectedTenantName"
      :can-open-target="Boolean(selected && auditTargetRoute(selected.target, authStore.activeRole))"
      @close="selected = null"
      @open-target="selected && openTarget(selected)"
      @filter-target="filterOn('target', $event)"
      @filter-actor="filterOn('actorId', $event)"
    />
  </div>
</template>
