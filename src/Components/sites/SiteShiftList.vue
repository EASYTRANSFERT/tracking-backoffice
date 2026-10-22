<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import ShiftAttendanceDialog from '@/Components/attendance/ShiftAttendanceDialog.vue'
import { attendanceStateDisplay, isDecidable, shiftAttendanceState } from '@/Components/attendance/shift-attendance'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import { addDays, formatTime, fromDayKey, startOfWeek, toDayKey, weekLabel } from '@/Components/sites/site-schedule'
import { getApiErrorMessage } from '@/Services/api-error'
import { useAssignmentStore } from '@/stores/assignment.store'
import { useAttendanceSessionStore } from '@/stores/attendance-session.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site, Team } from '@/types/administrator'
import type { AssignmentResponse } from '@/types/assignment'
import type { AttendanceSessionDecisionRequest } from '@/types/attendance-session'

/**
 * Planning d'un site en liste, par journée (superviseur) : le planning n'est pas
 * modifiable ; un clic sur un créneau ouvre son pointage, à valider ou à rejeter.
 */
const props = defineProps<{ site: Site; team?: Team }>()

const store = useAssignmentStore()
const sessionStore = useAttendanceSessionStore()
const feedback = useUiFeedbackStore()
const { assignments, members, weekStart, isLoading } = storeToRefs(store)
const { isLoading: isSessionsLoading, isDeciding } = storeToRefs(sessionStore)
const loadError = ref<string | null>(null)

const selectedShift = ref<AssignmentResponse | null>(null)
const dialogOpen = ref(false)
const dialogError = ref<string | null>(null)
const stateOf = (shift: AssignmentResponse) => shiftAttendanceState(shift, sessionStore.forAssignment(shift.id))
const pendingCount = computed(() => assignments.value.filter((shift) => isDecidable(stateOf(shift))).length)

const memberById = computed(() => new Map(members.value.map((member) => [member.id, member])))
const today = toDayKey(new Date())
// Créneau de nuit : il se termine le lendemain de sa prise de poste.
const isNightShift = (startAt: string, endAt: string) => toDayKey(new Date(endAt)) !== toDayKey(new Date(startAt))
const dayLabel = (key: string) => {
  const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromDayKey(key))
  return label.charAt(0).toUpperCase() + label.slice(1)
}
const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
}
const agentName = (userId: string) => {
  const member = memberById.value.get(userId)
  return member ? `${member.firstName} ${member.lastName}` : 'Agent'
}

/** Créneaux de la semaine regroupés par journée, dans l'ordre chronologique. */
const days = computed(() => {
  const groups = new Map<string, typeof assignments.value>()
  for (const shift of [...assignments.value].sort((a, b) => a.startAt.localeCompare(b.startAt))) {
    const list = groups.get(shift.day) ?? []
    list.push(shift)
    groups.set(shift.day, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, shifts]) => ({ key, shifts }))
})

/** Pointages de la semaine : leur absence (API indisponible) n'empêche pas d'afficher le planning. */
async function loadSessions(week: string) {
  try {
    await sessionStore.loadRange(props.site.id, fromDayKey(week).toISOString(), fromDayKey(addDays(week, 7)).toISOString())
  } catch (error) {
    sessionStore.reset()
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les pointages de cette semaine.'))
  }
}

async function load() {
  loadError.value = null
  sessionStore.reset()
  if (!props.site.teamId) { members.value = []; assignments.value = []; return }
  try {
    await Promise.all([store.loadTeamMembers(props.site.teamId), store.loadWeek(props.site.id, weekStart.value)])
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Impossible de charger le planning du site.')
    return
  }
  await loadSessions(weekStart.value)
}

async function goToWeek(nextWeekStart: string) {
  loadError.value = null
  try { await store.loadWeek(props.site.id, nextWeekStart) }
  catch (error) { loadError.value = getApiErrorMessage(error, 'Impossible de charger cette semaine.'); return }
  await loadSessions(nextWeekStart)
}

function openShift(shift: AssignmentResponse) {
  selectedShift.value = shift
  dialogError.value = null
  dialogOpen.value = true
}

async function decide(payload: AttendanceSessionDecisionRequest) {
  const session = selectedShift.value ? sessionStore.forAssignment(selectedShift.value.id) : undefined
  if (!session) return
  dialogError.value = null
  try {
    await sessionStore.decide(session.id, payload)
    dialogOpen.value = false
    feedback.success(payload.decision === 'VALIDATE' ? 'Pointage validé.' : 'Pointage rejeté.')
  } catch (error) {
    dialogError.value = getApiErrorMessage(error, payload.decision === 'VALIDATE' ? 'Impossible de valider ce pointage.' : 'Impossible de rejeter ce pointage.')
  }
}

watch(() => [props.site.id, props.site.teamId], load, { immediate: true })
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div class="flex items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-calendar-account-outline" color="primary" /></v-avatar>
        <div>
          <h2 class="text-base font-bold text-[#252830]">Planning</h2>
          <p class="mt-0.5 text-xs text-[#747985]">{{ team ? team.name : 'Aucune équipe affectée' }}<template v-if="pendingCount"> · <span class="font-semibold text-[#B26A00]">{{ pendingCount }} pointage{{ pendingCount > 1 ? 's' : '' }} à valider</span></template></p>
        </div>
      </div>
      <div v-if="site.teamId" class="flex flex-wrap items-center gap-3">
        <div class="flex items-center rounded-lg border border-[#e3e5ea]">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" density="comfortable" aria-label="Semaine précédente" @click="goToWeek(addDays(weekStart, -7))" />
          <span class="min-w-[230px] px-1 text-center text-sm font-semibold text-[#252830]">{{ weekLabel(weekStart) }}</span>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" density="comfortable" aria-label="Semaine suivante" @click="goToWeek(addDays(weekStart, 7))" />
        </div>
        <v-btn variant="text" size="small" class="normal-case" :disabled="weekStart === startOfWeek()" @click="goToWeek(startOfWeek())">Aujourd’hui</v-btn>
      </div>
    </div>
    <v-divider />
    <v-progress-linear v-if="isLoading || isSessionsLoading" indeterminate color="primary" height="2" />

    <AppEmptyState v-if="!site.teamId" icon="mdi-account-group-outline" title="Aucune équipe sur ce site" description="L’administrateur doit affecter une équipe à ce site." />
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="ma-6" :text="loadError" />
    <AppEmptyState v-else-if="!days.length && !isLoading" icon="mdi-calendar-blank-outline" title="Aucun créneau cette semaine" description="Aucun agent n’est planifié sur ce site pendant cette semaine." />

    <div v-else class="divide-y divide-[#eceef2]">
      <section v-for="day in days" :key="day.key">
        <div class="flex items-center gap-2 px-6 py-3" :class="day.key === today ? 'bg-[#FDE9EA]' : 'bg-[#FAFAFB]'">
          <span class="text-sm font-semibold" :class="day.key === today ? 'text-[#D80F16]' : 'text-[#252830]'">{{ dayLabel(day.key) }}</span>
          <v-chip v-if="day.key === today" size="x-small" color="primary" variant="flat">Aujourd’hui</v-chip>
          <span class="ml-auto text-xs text-[#848484]">{{ day.shifts.length }} créneau{{ day.shifts.length > 1 ? 'x' : '' }}</span>
        </div>
        <ul>
          <li v-for="shift in day.shifts" :key="shift.id" class="border-t border-[#f1f2f5] first:border-t-0">
            <button type="button" class="flex w-full items-center gap-4 px-6 py-3 text-left transition hover:bg-[#FAFAFB] focus-visible:bg-[#FAFAFB] focus-visible:outline-none" :aria-label="`Pointage de ${agentName(shift.userId)}, ${formatTime(shift.startAt)} – ${formatTime(shift.endAt)}`" @click="openShift(shift)">
              <span class="w-[120px] shrink-0 text-sm font-semibold tabular-nums text-[#252830]">{{ formatTime(shift.startAt) }} – {{ formatTime(shift.endAt) }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-[#3f434d]">
                {{ agentName(shift.userId) }}
                <v-chip v-if="shift.userId === team?.leadUserId" size="x-small" color="primary" variant="tonal" class="ml-1">Chef d’équipe</v-chip>
              </span>
              <span v-if="isNightShift(shift.startAt, shift.endAt)" class="hidden items-center gap-1 text-xs text-[#4B5A86] sm:flex"><v-icon icon="mdi-weather-night" size="14" />Nuit</span>
              <span class="hidden w-[60px] shrink-0 text-right text-xs text-[#848484] sm:block">{{ duration(shift.durationMin) }}</span>
              <span class="flex w-[150px] shrink-0 justify-end">
                <v-chip v-if="attendanceStateDisplay[stateOf(shift)]" size="small" variant="tonal" :color="attendanceStateDisplay[stateOf(shift)]!.color" :prepend-icon="attendanceStateDisplay[stateOf(shift)]!.icon">{{ attendanceStateDisplay[stateOf(shift)]!.label }}</v-chip>
              </span>
              <v-icon icon="mdi-chevron-right" size="18" color="grey" />
            </button>
          </li>
        </ul>
      </section>
    </div>

    <ShiftAttendanceDialog
      v-model="dialogOpen"
      :shift="selectedShift"
      :session="selectedShift ? sessionStore.forAssignment(selectedShift.id) : undefined"
      :agent-name="selectedShift ? agentName(selectedShift.userId) : ''"
      :loading="isDeciding"
      :error-message="dialogError"
      @decide="decide"
    />
  </v-card>
</template>
