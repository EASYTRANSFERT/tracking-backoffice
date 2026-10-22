import { ref } from 'vue'
import { defineStore } from 'pinia'

import { attendanceSessionService } from '@/Services/attendance-session.service'

import type { AttendanceSessionDecisionRequest, AttendanceSessionResponse } from '@/types/attendance-session'

/** Pointages d'un site sur une semaine, rattachés aux créneaux du planning. */
export const useAttendanceSessionStore = defineStore('attendance-session', () => {
  const sessions = ref<AttendanceSessionResponse[]>([])
  const isLoading = ref(false)
  const isDeciding = ref(false)
  let requestKey = ''

  /** Pointage rattaché à un créneau, s'il existe. */
  const forAssignment = (assignmentId: string) => sessions.value.find((session) => session.assignmentId === assignmentId)

  async function loadRange(siteId: string, from: string, to: string) {
    const key = `${siteId}|${from}|${to}`
    requestKey = key
    isLoading.value = true
    try {
      const items: AttendanceSessionResponse[] = []
      let cursor: string | undefined
      do {
        const page = await attendanceSessionService.list({ siteId, from, to, cursor, limit: 200 })
        items.push(...page.items)
        cursor = page.nextCursor ?? undefined
      } while (cursor)
      // Ignore une réponse arrivée après un changement de semaine ou de site.
      if (requestKey === key) sessions.value = items
    } finally {
      isLoading.value = false
    }
  }

  async function decide(id: string, payload: AttendanceSessionDecisionRequest) {
    if (payload.decision === 'REJECT' && !payload.reason?.trim()) throw new Error('Le motif du rejet est obligatoire.')
    isDeciding.value = true
    try {
      const updated = await attendanceSessionService.decide(id, payload)
      sessions.value = sessions.value.map((session) => session.id === id ? updated : session)
      return updated
    } finally {
      isDeciding.value = false
    }
  }

  function reset() {
    sessions.value = []
    requestKey = ''
  }

  return { sessions, isLoading, isDeciding, forAssignment, loadRange, decide, reset }
})
