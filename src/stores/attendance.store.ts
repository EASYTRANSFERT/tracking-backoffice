import { ref } from 'vue'
import { defineStore } from 'pinia'

import { sessionService } from '@/Services/session.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import { nameOr } from '@/utils/people'
import type { DecideSessionRequest, WorkSessionResponse } from '@/types/attendance'

/**
 * Pointages (sessions de travail) des sites d'une mission, partagés par l'administrateur
 * (consultation) et le superviseur (consultation et décision).
 */
export const useAttendanceStore = defineStore('attendance', () => {
  const sessions = ref<WorkSessionResponse[]>([])
  const isLoading = ref(false)
  const isDeciding = ref(false)

  /** L'API ne renvoie que userId : le nom vient des comptes déjà connus. */
  const agentName = (userId: string) => nameOr(useAdministratorStore().findUser(userId), 'Agent')

  // L'API ne filtre pas par mission : une requête par site, au plus récent d'abord.
  async function loadSiteSessions(siteIds: string[], flagged: boolean) {
    isLoading.value = true
    try {
      const pages = await Promise.all(siteIds.map((siteId) => sessionService.list({ siteId, flagged: flagged || undefined, limit: 200 })))
      sessions.value = pages.flatMap((page) => page.items).sort((a, b) => b.inAt.localeCompare(a.inAt))
      await useAdministratorStore().ensureUsers(sessions.value.map((session) => session.userId))
    } finally {
      isLoading.value = false
    }
  }

  /** Détail à jour d'une session, à l'ouverture de son examen. */
  async function loadSession(sessionId: string) {
    const fresh = await sessionService.findOne(sessionId)
    replaceSession(fresh)
    return fresh
  }

  /** Lien signé valable 5 minutes ; chaque appel est journalisé par l'API. */
  async function loadSelfie(sessionId: string) {
    return (await sessionService.getSelfie(sessionId)).url
  }

  async function decide(sessionId: string, payload: DecideSessionRequest) {
    if (payload.decision === 'REJECT' && (payload.reason?.trim().length ?? 0) < 3) throw new Error('Le motif du rejet doit compter au moins 3 caractères.')
    isDeciding.value = true
    try {
      const updated = await sessionService.decide(sessionId, { decision: payload.decision, reason: payload.reason?.trim() || undefined })
      replaceSession(updated)
      return updated
    } finally {
      isDeciding.value = false
    }
  }

  function replaceSession(updated: WorkSessionResponse) {
    sessions.value = sessions.value.map((session) => session.id === updated.id ? updated : session)
  }

  function reset() {
    sessions.value = []
  }

  return { sessions, isLoading, isDeciding, agentName, loadSiteSessions, loadSession, loadSelfie, decide, reset }
})
