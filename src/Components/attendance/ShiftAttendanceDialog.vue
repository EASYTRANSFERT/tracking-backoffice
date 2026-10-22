<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { attendanceStateDisplay, flagLabel, isDecidable, shiftAttendanceState } from '@/Components/attendance/shift-attendance'
import { formatTime } from '@/Components/sites/site-schedule'
import type { AssignmentResponse } from '@/types/assignment'
import type { AttendanceSessionDecisionRequest, AttendanceSessionResponse } from '@/types/attendance-session'

const props = defineProps<{
  modelValue: boolean
  shift: AssignmentResponse | null
  session?: AttendanceSessionResponse
  agentName: string
  loading?: boolean
  errorMessage?: string | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; decide: [payload: AttendanceSessionDecisionRequest] }>()

const decision = ref<'VALIDATE' | 'REJECT'>('VALIDATE')
const reason = ref('')
const correctedOutTime = ref('')

const state = computed(() => props.shift ? shiftAttendanceState(props.shift, props.session) : 'upcoming')
const display = computed(() => attendanceStateDisplay[state.value])
const canDecide = computed(() => isDecidable(state.value))
const needsCorrectedExit = computed(() => state.value === 'missingExit' && decision.value === 'VALIDATE')
const canSubmit = computed(() =>
  (decision.value !== 'REJECT' || Boolean(reason.value.trim())) &&
  (!needsCorrectedExit.value || Boolean(correctedOutTime.value)),
)

const dateLabel = computed(() => props.shift
  ? new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(props.shift.startAt))
  : '')
const minutesLabel = (minutes?: number | null) => minutes ? `${minutes} min` : null

watch(() => props.modelValue, (open) => {
  if (!open) return
  decision.value = 'VALIDATE'
  reason.value = ''
  // Par défaut, la sortie corrigée reprend la fin prévue du créneau.
  correctedOutTime.value = props.shift ? formatTime(props.shift.endAt) : ''
})

/** Heure de sortie corrigée : le jour de fin prévu du créneau, à l'heure saisie. */
function correctedOutAt(): string | undefined {
  if (!needsCorrectedExit.value || !props.shift || !correctedOutTime.value) return undefined
  const [hours, minutes] = correctedOutTime.value.split(':').map(Number)
  const date = new Date(props.shift.endAt)
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return date.toISOString()
}

function submit() {
  if (!canSubmit.value) return
  emit('decide', { decision: decision.value, reason: reason.value.trim() || undefined, correctedOutAt: correctedOutAt() })
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="shift">
      <v-card-title class="flex items-start justify-between gap-3 px-6 pt-6">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold">{{ agentName }}</h2>
          <p class="mt-1 text-sm font-normal text-[#747985]">{{ dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1) }} · prévu {{ formatTime(shift.startAt) }} – {{ formatTime(shift.endAt) }}</p>
        </div>
        <v-chip v-if="display" :color="display.color" :prepend-icon="display.icon" size="small" variant="tonal">{{ display.label }}</v-chip>
      </v-card-title>

      <v-card-text class="space-y-5 px-6 py-5">
        <div v-if="!session" class="rounded-lg bg-[#F6F6F7] px-4 py-5 text-center text-sm text-[#535865]">
          {{ state === 'upcoming' ? 'Ce créneau n’a pas encore commencé.' : 'L’agent n’a pas pointé pour ce créneau : il n’y a rien à valider.' }}
        </div>

        <template v-else>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-lg border border-[#eceef2] px-4 py-3">
              <p class="text-xs text-[#848484]">Arrivée</p>
              <p class="mt-1 text-lg font-bold tabular-nums">{{ formatTime(session.inAt) }}</p>
              <p v-if="minutesLabel(session.lateMin)" class="text-xs font-semibold text-[#B26A00]">Retard : {{ minutesLabel(session.lateMin) }}</p>
            </div>
            <div class="rounded-lg border border-[#eceef2] px-4 py-3">
              <p class="text-xs text-[#848484]">Départ</p>
              <p class="mt-1 text-lg font-bold tabular-nums">{{ session.outAt ? formatTime(session.outAt) : '—' }}</p>
              <p v-if="!session.outAt" class="text-xs font-semibold text-[#B26A00]">{{ state === 'inProgress' ? 'Toujours en poste' : 'Non pointé' }}</p>
              <p v-else-if="minutesLabel(session.earlyMin)" class="text-xs font-semibold text-[#B26A00]">Départ anticipé : {{ minutesLabel(session.earlyMin) }}</p>
            </div>
          </div>

          <div v-if="session.flags.length">
            <p class="mb-2 text-xs text-[#848484]">Anomalies relevées</p>
            <div class="flex flex-wrap gap-2"><v-chip v-for="flag in session.flags" :key="flag" size="small" color="warning" variant="tonal" prepend-icon="mdi-alert-outline">{{ flagLabel(flag) }}</v-chip></div>
          </div>

          <p v-if="session.decisionReason && !canDecide" class="rounded-lg bg-[#F6F6F7] px-4 py-3 text-sm text-[#535865]"><span class="font-semibold">Motif :</span> {{ session.decisionReason }}</p>

          <template v-if="canDecide">
            <v-divider />
            <v-btn-toggle v-model="decision" mandatory color="primary" divided class="w-full">
              <v-btn value="VALIDATE" class="flex-1" prepend-icon="mdi-check-circle-outline">Valider</v-btn>
              <v-btn value="REJECT" class="flex-1" prepend-icon="mdi-close-circle-outline">Rejeter</v-btn>
            </v-btn-toggle>
            <v-text-field v-if="needsCorrectedExit" v-model="correctedOutTime" type="time" label="Heure de sortie retenue" hint="L’agent n’a pas pointé son départ : indiquez l’heure à retenir." persistent-hint />
            <v-textarea v-model="reason" rows="2" auto-grow :label="decision === 'REJECT' ? 'Motif du rejet' : 'Commentaire (facultatif)'" :hint="decision === 'REJECT' ? 'Obligatoire pour un rejet' : undefined" persistent-hint />
          </template>
        </template>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" :text="errorMessage" />
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false)">{{ canDecide ? 'Annuler' : 'Fermer' }}</v-btn>
        <v-btn v-if="canDecide" color="primary" variant="flat" :loading="loading" :disabled="!canSubmit" @click="submit">{{ decision === 'VALIDATE' ? 'Valider le pointage' : 'Rejeter le pointage' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
