import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { mockAttendanceSessions } from '@/mocks/attendance-data'
import type { AttendanceDecision, AttendanceSession } from '@/types/attendance'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'

export const useAttendanceStore = defineStore('attendance', () => {
  const sessions = ref<AttendanceSession[]>(
    mockMode ? structuredClone(mockAttendanceSessions) : [],
  )

  const pendingCount = computed(() => sessions.value.filter(
    (session) => ['pending', 'missingExit'].includes(session.status),
  ).length)

  function decide(sessionId: string, payload: AttendanceDecision) {
    const session = sessions.value.find((item) => item.id === sessionId)
    if (!session) throw new Error('Session de pointage introuvable.')

    if (payload.decision === 'reject' && !payload.reason?.trim()) {
      throw new Error('Le motif du rejet est obligatoire.')
    }

    if (session.status === 'missingExit' && payload.decision === 'validate') {
      if (!payload.correctedClockOutAt) {
        throw new Error("L’heure de sortie corrigée est obligatoire.")
      }
      session.clockOutAt = new Date(payload.correctedClockOutAt).toISOString()
    }

    session.status = payload.decision === 'validate' ? 'validated' : 'rejected'
    session.decisionReason = payload.reason?.trim() || undefined
  }

  return {
    sessions,
    pendingCount,
    usesMockData: mockMode,
    decide,
  }
})
