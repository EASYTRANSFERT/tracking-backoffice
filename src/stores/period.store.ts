import { ref } from 'vue'
import { defineStore } from 'pinia'

import { periodService } from '@/Services/period.service'
import { useAuthStore } from '@/stores/auth.store'
import { listAllPages } from '@/utils/pagination'
import type { ClosePeriodRequest, PeriodResponse } from '@/types/period'

/** La clôture est asynchrone : on interroge la période toutes les deux secondes, une minute au plus. */
export const CLOSURE_POLL_INTERVAL_MS = 2000
export const CLOSURE_MAX_POLLS = 30

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const usePeriodStore = defineStore('period', () => {
  const periods = ref<PeriodResponse[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const findPeriod = (id: string) => periods.value.find((period) => period.id === id)

  /** Toutes les périodes, de la plus récente à la plus ancienne : le filtre par état se fait dans le tableau. */
  async function loadPeriods(force = false) {
    if (hasLoaded.value && !force) return
    isLoading.value = true
    try {
      periods.value = await listAllPages((page) => periodService.list(page))
      hasLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  /** Détail d'une période, avec ses blocages de clôture à l'instant. */
  async function loadPeriod(id: string) {
    const period = await periodService.findOne(id)
    replacePeriod(period)
    return period
  }

  async function createPeriod(teamId: string, from: string, to: string) {
    isSaving.value = true
    try {
      const created = await periodService.create({ teamId, from, to })
      periods.value = [created, ...periods.value].sort((a, b) => b.from.localeCompare(a.from))
      return created
    } finally {
      isSaving.value = false
    }
  }

  async function reopenPeriod(id: string, reason: string) {
    isSaving.value = true
    try {
      const period = await periodService.reopen(id, { reason })
      replacePeriod(period)
      return period
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Clôture : step-up TOTP si un code est fourni (un refus « blocages » puis un forçage réutilisent
   * le step-up récent), puis demande de clôture, puis suivi jusqu'à CLOSED ou retour en validation.
   */
  async function closePeriod(id: string, request: ClosePeriodRequest, totpCode?: string) {
    isSaving.value = true
    try {
      if (totpCode) await useAuthStore().stepUp(totpCode)
      let period = await periodService.close(id, request)
      replacePeriod(period)
      for (let polls = 0; period.state === 'CLOSING' && polls < CLOSURE_MAX_POLLS; polls += 1) {
        await wait(CLOSURE_POLL_INTERVAL_MS)
        period = await periodService.findOne(id)
        replacePeriod(period)
      }
      return period
    } finally {
      isSaving.value = false
    }
  }

  function replacePeriod(period: PeriodResponse) {
    const index = periods.value.findIndex((item) => item.id === period.id)
    if (index >= 0) periods.value[index] = period
    else periods.value = [period, ...periods.value]
  }

  function resetData() {
    periods.value = []
    hasLoaded.value = false
  }

  return { periods, hasLoaded, isLoading, isSaving, findPeriod, loadPeriods, loadPeriod, createPeriod, reopenPeriod, closePeriod, resetData }
})
