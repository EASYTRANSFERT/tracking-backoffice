<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppDataTable, { type AppDataTableColumn } from '@/Components/common/AppDataTable.vue'
import AttendanceSessionDialog from '@/Components/attendance/AttendanceSessionDialog.vue'
import { checkResultConfig, flagLabels, formatDateTime, formatMinutes, isDecidable, validationConfig } from '@/Components/attendance/attendance-labels'
import { useTeamCheck } from '@/composables/useTeamCheck'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { matchesSearch } from '@/utils/search'
import type { ApiSessionValidation, WorkSessionResponse } from '@/types/attendance'
import type { Site } from '@/types/administrator'

/**
 * Pointages des sites d'une mission. canDecide : le superviseur peut valider ou rejeter.
 * canAdjust : l'administrateur peut régulariser une session (page Régularisations).
 * canCheck : la mission est en cours, un contrôle de présence peut être lancé sur ses équipes.
 */
const props = defineProps<{ sites: Site[]; canDecide?: boolean; canAdjust?: boolean; canCheck?: boolean; teamName?: (teamId: string) => string }>()

const store = useAttendanceStore()
const feedback = useUiFeedbackStore()
const flagged = ref(false)
const query = ref('')
const validation = ref<ApiSessionValidation | 'all'>('all')
const date = ref('')
const selected = ref<WorkSessionResponse>()
const dialog = ref(false)

const siteIds = computed(() => props.sites.map((site) => site.id))
const siteName = (siteId?: string) => props.sites.find((site) => site.id === siteId)?.name ?? 'Site'

// Équipes des sites de la mission : celles qu'un contrôle de présence peut viser.
const { triggeringTeamId, trigger: triggerCheck } = useTeamCheck()
const teams = computed(() => [...new Set(props.sites.map((site) => site.teamId).filter((id): id is string => Boolean(id)))]
  .map((id) => ({ id, name: props.teamName?.(id) ?? props.sites.filter((site) => site.teamId === id).map((site) => site.name).join(', ') })))
// Avec un seul site, la colonne Site répéterait le même nom sur chaque ligne.
const showSite = computed(() => props.sites.length > 1)
// Dernier contrôle de la session ; l'historique complet est dans l'examen du pointage.
const checkOf = (session: WorkSessionResponse) => store.checksBySession.get(session.id)?.[0]

const filtered = computed(() => store.sessions.filter((session) =>
  matchesSearch(query.value, store.agentName(session.userId), siteName(session.siteId)) &&
  (validation.value === 'all' || session.validation === validation.value) &&
  (!date.value || session.inAt.slice(0, 10) === date.value),
))
const validationItems = [{ title: 'Toutes les décisions', value: 'all' }, ...Object.entries(validationConfig).map(([value, config]) => ({ title: config.label, value }))]

watch([siteIds, flagged], async ([ids]) => {
  if (!ids.length) { store.reset(); return }
  try { await store.loadSiteSessions(ids, flagged.value) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les pointages.')) }
}, { immediate: true })
watch(teams, async (list) => {
  if (!list.length) return
  try { await store.loadTeamChecks(list.map((team) => team.id)) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les contrôles de présence.')) }
}, { immediate: true })

const cell = 'whitespace-nowrap text-sm text-[#535865]'
const columns = computed<AppDataTableColumn[]>(() => [
  { key: 'agent', title: 'Agent', cellClass: 'whitespace-nowrap font-semibold text-[#292d38]' },
  { key: 'site', title: 'Site', cellClass: 'text-sm text-[#535865]', show: showSite.value },
  { key: 'inAt', title: 'Entrée', cellClass: cell },
  { key: 'outAt', title: 'Sortie', cellClass: cell },
  { key: 'minutes', title: 'Durée', cellClass: cell },
  { key: 'flags', title: 'Anomalies' },
  { key: 'check', title: 'Contrôle' },
  { key: 'validation', title: 'Décision' },
  { key: 'action', title: 'Action', class: 'text-right', cellClass: 'text-right' },
])

function review(session: WorkSessionResponse) {
  selected.value = session
  dialog.value = true
}
</script>

<template>
  <AppDataTable
    :items="filtered"
    :columns="columns"
    :page-size="8"
    :reset-on="[query, validation, date, siteIds, flagged]"
    :loading="store.isLoading"
    clickable
    label="sessions"
    :table-class="showSite ? '[&_table]:min-w-[1080px]' : '[&_table]:min-w-[960px]'"
    empty-icon="mdi-clock-check-outline"
    empty-title="Aucun pointage à afficher"
    :empty-description="flagged ? 'Aucune session avec anomalie sur ces sites.' : 'Aucune session ne correspond aux filtres sélectionnés.'"
    @click:row="review"
  >
    <template #header>
  <div class="flex flex-col gap-4 px-6 py-5">
        <div class="flex flex-wrap items-center gap-3">
          <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-clock-check-outline" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Pointages</h2><p class="mt-1 text-xs text-[#747985]">{{ canDecide ? 'Examinez les sessions et tranchez celles qui sont à valider.' : 'Sessions de travail des agents sur les sites de la mission.' }}</p></div>
          <template v-if="canCheck && teams.length">
            <v-btn v-if="teams.length === 1" class="ml-auto" size="small" variant="tonal" color="primary" prepend-icon="mdi-account-check-outline" :loading="triggeringTeamId === teams[0]!.id" @click="triggerCheck(teams[0]!.id, teams[0]!.name)">Lancer un contrôle</v-btn>
            <v-menu v-else location="bottom start">
              <template #activator="{ props: menuProps }"><v-btn v-bind="menuProps" class="ml-auto" size="small" variant="tonal" color="primary" prepend-icon="mdi-account-check-outline" append-icon="mdi-chevron-down" :loading="Boolean(triggeringTeamId)">Lancer un contrôle</v-btn></template>
              <v-list density="compact">
                <v-list-subheader>Équipe à contrôler</v-list-subheader>
                <v-list-item v-for="team in teams" :key="team.id" :title="team.name" prepend-icon="mdi-account-group-outline" @click="triggerCheck(team.id, team.name)" />
              </v-list>
            </v-menu>
          </template>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr]">
          <v-btn-toggle v-model="flagged" mandatory color="primary" variant="outlined" density="comfortable" class="gap-3">
            <v-btn :value="true" prepend-icon="mdi-alert-outline">Anomalies</v-btn>
            <v-btn :value="false">Toutes</v-btn>
          </v-btn-toggle>
          <v-text-field v-model="query" :placeholder="showSite ? 'Agent ou site' : 'Agent'" prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable />
          <v-select v-model="validation" :items="validationItems" density="compact" hide-details />
          <v-text-field v-model="date" type="date" density="compact" hide-details clearable />
        </div>
      </div>
    </template>
    <template #cell-agent="{ item: session }">{{ store.agentName(session.userId) }}</template>
    <template #cell-site="{ item: session }">{{ siteName(session.siteId) }}</template>
    <template #cell-inAt="{ item: session }">{{ formatDateTime(session.inAt) }}</template>
    <template #cell-outAt="{ item: session }">{{ formatDateTime(session.outAt) }}</template>
    <template #cell-minutes="{ item: session }">{{ formatMinutes(session.minutes) }}<span v-if="session.lateMin" class="block text-xs text-[#a76000]">{{ formatMinutes(session.lateMin) }} de retard</span></template>
    <template #cell-flags="{ item: session }">
      <div v-if="session.flags.length" class="flex flex-wrap gap-1 py-2">
        <v-chip size="x-small" color="warning" variant="tonal">{{ flagLabels[session.flags[0]!] ?? session.flags[0] }}</v-chip>
        <v-chip v-if="session.flags.length > 1" size="x-small" variant="tonal">+{{ session.flags.length - 1 }}</v-chip>
      </div>
      <span v-else class="text-xs text-[#848484]">Aucune</span>
    </template>
    <template #cell-check="{ item: session }">
      <div v-if="checkOf(session)" class="flex items-center gap-1">
        <v-chip size="small" variant="tonal" :color="checkResultConfig[checkOf(session)!.result].color" :prepend-icon="checkResultConfig[checkOf(session)!.result].icon">{{ checkResultConfig[checkOf(session)!.result].label }}</v-chip>
      </div>
      <span v-else class="text-xs text-[#848484]">—</span>
    </template>
    <template #cell-validation="{ item: session }"><v-chip size="small" :color="validationConfig[session.validation].color" variant="tonal">{{ validationConfig[session.validation].label }}</v-chip></template>
    <template #cell-action="{ item: session }"><v-btn size="small" color="primary" variant="tonal" @click.stop="review(session)">{{ canDecide && isDecidable(session) ? 'Examiner' : 'Voir' }}</v-btn></template>
    <template #footer>
      <AttendanceSessionDialog v-model="dialog" :session="selected" :site-name="siteName(selected?.siteId)" :can-decide="canDecide" :can-adjust="canAdjust" />
    </template>
  </AppDataTable>
</template>
