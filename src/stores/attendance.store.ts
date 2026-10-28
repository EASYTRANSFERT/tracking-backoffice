import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { checkService } from '@/Services/check.service'
import { sessionService } from '@/Services/session.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import { listAllPages } from '@/utils/pagination'
import { nameOr } from '@/utils/people'
import type { DecideSessionRequest, WorkSessionResponse } from '@/types/attendance'
import type { CheckResponse } from '@/types/check'

/**
 * Pointages (sessions de travail) des sites d'une mission, partagés par l'administrateur
 * (consultation) et le superviseur (consultation et décision), ainsi que les contrôles de présence
 * de leurs équipes, que tous deux peuvent lancer.
 */
export const useAttendanceStore = defineStore('attendance', () => {
  const sessions = ref<WorkSessionResponse[]>([])
  const isLoading = ref(false)
  const isDeciding = ref(false)
  const checks = ref<CheckResponse[]>([])
  const isChecksLoading = ref(false)
  /** Dernier contrôle de chaque session : checks est trié du plus récent au plus ancien. */
  const latestCheckBySession = computed(() => {
    const latest = new Map<string, CheckResponse>()
    for (const check of checks.value) if (!latest.has(check.sessionId)) latest.set(check.sessionId, check)
    return latest
  })
  /** Équipe dont le contrôle est en cours de lancement. */
  const triggeringTeamId = ref<string | null>(null)

  /** L'API ne renvoie que userId : le nom vient des comptes déjà connus. */
  const agentName = (userId: string) => nameOr(useAdministratorStore().findUser(userId), 'Agent')

  // L'API ne filtre pas par mission : toutes les pages de chaque site, au plus récent d'abord.
  async function loadSiteSessions(siteIds: string[], flagged: boolean) {
    isLoading.value = true
    try {
      const perSite = await Promise.all(siteIds.map((siteId) => listAllPages((page) => sessionService.list({ ...page, siteId, flagged: flagged || undefined }))))
      sessions.value = perSite.flat().sort((a, b) => b.inAt.localeCompare(a.inAt))
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

  // Toutes les pages de chaque équipe, au plus récent d'abord.
  async function loadTeamChecks(teamIds: string[]) {
    isChecksLoading.value = true
    try {
      const perTeam = await Promise.all(teamIds.map((teamId) => listAllPages((page) => checkService.list({ ...page, teamId }))))
      checks.value = perTeam.flat().sort((a, b) => b.dueAt.localeCompare(a.dueAt))
      await useAdministratorStore().ensureUsers(checks.value.map((check) => check.userId))
    } finally {
      isChecksLoading.value = false
    }
  }

  /** Un contrôle par agent pointé de l'équipe ; le chef d'équipe y répond depuis l'application. */
  async function triggerTeamCheck(teamId: string) {
    triggeringTeamId.value = teamId
    try {
      const campaign = await checkService.trigger({ teamId })
      checks.value = [...campaign.checks, ...checks.value]
      await useAdministratorStore().ensureUsers(campaign.checks.map((check) => check.userId))
      return campaign
    } finally {
      triggeringTeamId.value = null
    }
  }

  function reset() {
    sessions.value = []
  }

  return {
    sessions, isLoading, isDeciding, agentName, loadSiteSessions, loadSession, loadSelfie, decide, reset,
    checks, latestCheckBySession, isChecksLoading, triggeringTeamId, loadTeamChecks, triggerTeamCheck,
  }
})
