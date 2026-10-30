import { ref } from 'vue'
import { defineStore } from 'pinia'

import { adjustmentService } from '@/Services/adjustment.service'
import { sessionService } from '@/Services/session.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import { usePeriodStore } from '@/stores/period.store'
import { isPeriodClosed } from '@/utils/adjustment-format'
import { nameOr } from '@/utils/people'
import type { AdjustmentResponse, CreateAdjustmentRequest } from '@/types/adjustment'
import type { SessionListQuery, WorkSessionResponse } from '@/types/attendance'
import type { PeriodResponse } from '@/types/period'

const PAGE_SIZE = 50

/**
 * Régularisations : on cherche une session (GET /sessions), on la choisit, puis on la corrige
 * (POST /sessions/{id}/adjustments) et on lit son historique. Une régularisation ne se modifie pas.
 */
export const useAdjustmentStore = defineStore('adjustment', () => {
  const results = ref<WorkSessionResponse[]>([])
  const nextCursor = ref<string | null>(null)
  const isSearching = ref(false)
  let lastQuery: SessionListQuery = {}

  const selected = ref<WorkSessionResponse | null>(null)
  const selectedPeriod = ref<PeriodResponse | null>(null)
  const history = ref<AdjustmentResponse[]>([])
  const isHistoryLoading = ref(false)
  const isSaving = ref(false)

  /** Période close : le formulaire n'est pas proposé. Période inconnue : l'API reste juge. */
  const isLocked = () => isPeriodClosed(selectedPeriod.value)
  const personName = (id?: string, fallback = '—') => id ? nameOr(useAdministratorStore().findUser(id), fallback) : fallback

  const rememberPeople = (ids: (string | undefined)[]) => useAdministratorStore().ensureUsers(ids).catch(() => undefined)

  async function search(filters: SessionListQuery = {}) {
    lastQuery = { ...filters, limit: PAGE_SIZE }
    isSearching.value = true
    try {
      const page = await sessionService.list(lastQuery)
      results.value = page.items
      nextCursor.value = page.nextCursor ?? null
      await rememberPeople(page.items.map((session) => session.userId))
    } finally {
      isSearching.value = false
    }
  }

  async function loadMore() {
    if (!nextCursor.value || isSearching.value) return
    isSearching.value = true
    try {
      const page = await sessionService.list({ ...lastQuery, cursor: nextCursor.value })
      results.value = [...results.value, ...page.items]
      nextCursor.value = page.nextCursor ?? null
      await rememberPeople(page.items.map((session) => session.userId))
    } finally {
      isSearching.value = false
    }
  }

  async function loadHistory(sessionId: string) {
    isHistoryLoading.value = true
    try {
      const list = await adjustmentService.list(sessionId)
      // Ignore une réponse arrivée après le choix d'une autre session.
      if (selected.value?.id === sessionId) history.value = list
      await rememberPeople(list.map((item) => item.authorId))
    } finally {
      isHistoryLoading.value = false
    }
  }

  async function loadPeriod(session: WorkSessionResponse) {
    if (!session.periodId) return
    try {
      const period = await usePeriodStore().loadPeriod(session.periodId)
      if (selected.value?.id === session.id) selectedPeriod.value = period
    } catch {
      // Période illisible : on laisse l'API trancher (409 PERIOD_CLOSED).
    }
  }

  async function select(session: WorkSessionResponse) {
    selected.value = session
    selectedPeriod.value = null
    history.value = []
    await rememberPeople([session.userId])
    await Promise.all([loadHistory(session.id), loadPeriod(session)])
  }

  /** Arrivée depuis une session (lien « Régulariser ») : on relit la session, qui n'est pas forcément dans la liste. */
  async function selectById(sessionId: string) {
    await select(await sessionService.findOne(sessionId))
  }

  async function regularize(request: CreateAdjustmentRequest) {
    const session = selected.value
    if (!session) throw new Error('Choisissez d’abord une session.')
    isSaving.value = true
    try {
      const created = await adjustmentService.create(session.id, request)
      history.value = [...history.value, created]
      await rememberPeople([created.authorId])
      // La session a changé (heures, durée, statut CORRECTED) : on la relit pour la liste comme pour le résumé.
      const fresh = await sessionService.findOne(session.id)
      selected.value = fresh
      results.value = results.value.map((item) => item.id === fresh.id ? fresh : item)
      return created
    } finally {
      isSaving.value = false
    }
  }

  function reset() {
    results.value = []
    nextCursor.value = null
    selected.value = null
    selectedPeriod.value = null
    history.value = []
  }

  return {
    results, nextCursor, isSearching, selected, selectedPeriod, history, isHistoryLoading, isSaving,
    isLocked, personName, search, loadMore, select, selectById, regularize, reset,
  }
})
