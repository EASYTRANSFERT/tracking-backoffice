<script setup lang="ts">
import { getApiErrorMessage } from '@/Services/api-error'
import { computed, ref } from 'vue'

import AttendanceDecisionDialog from '@/Components/attendance/AttendanceDecisionDialog.vue'
import AttendanceTable from '@/Components/attendance/AttendanceTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useProfileScope } from '@/composables/useProfileScope'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { AttendanceDecision, AttendanceSession } from '@/types/attendance'

const attendanceStore = useAttendanceStore()
const feedback = useUiFeedbackStore()
const { supervisedTeams } = useProfileScope()
const dialogOpen = ref(false)
const selectedSession = ref<AttendanceSession>()

const teamIds = computed(() => new Set(supervisedTeams.value.map((team) => team.id)))
const scopedSessions = computed(() => attendanceStore.sessions.filter(
  (session) => teamIds.value.has(session.teamId),
))
const scopedPendingCount = computed(() => scopedSessions.value.filter(
  (session) => ['pending', 'missingExit'].includes(session.status),
).length)

function review(session: AttendanceSession) {
  selectedSession.value = session
  dialogOpen.value = true
}

function confirm(decision: AttendanceDecision) {
  if (!selectedSession.value) return
  try {
    attendanceStore.decide(selectedSession.value.id, decision)
    dialogOpen.value = false
    feedback.success(decision.decision === 'validate' ? 'Pointage validé.' : 'Pointage rejeté.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer la décision.'))
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Pointages</template>
      <template #description>Validez les sessions non conformes des équipes que vous supervisez.</template>
      <template #actions><v-chip color="warning" variant="tonal" prepend-icon="mdi-clock-alert-outline">{{ scopedPendingCount }} à traiter</v-chip></template>
    </PageHeader>

    <v-alert
      v-if="!attendanceStore.usesMockData"
      class="mb-6"
      type="info"
      variant="tonal"
      title="Connexion API en attente"
      text="Le DAT prévoit les endpoints de sessions et de décision, mais leur contrat n’est pas encore présent dans l’API intégrée au projet. Aucun appel fictif n’est effectué."
    />

    <AttendanceTable :sessions="scopedSessions" @review="review" />
    <AttendanceDecisionDialog v-model="dialogOpen" :session="selectedSession" @confirm="confirm" />
  </div>
</template>
