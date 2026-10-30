import { ref } from 'vue'
import { defineStore } from 'pinia'

import { periodService } from '@/Services/period.service'
import { openDownload } from '@/utils/download'
import { reportFilename } from '@/utils/period-report'
import type { PeriodDailyPageResponse, PeriodReportFormat, PeriodTotalsResponse } from '@/types/period'

/** Bilan d'une période : totaux, détail par jour et fichiers Excel / PDF. */
export const usePeriodBilanStore = defineStore('period-bilan', () => {
  const totals = ref<PeriodTotalsResponse | null>(null)
  const isLoading = ref(false)
  const downloading = ref<PeriodReportFormat | null>(null)

  async function loadTotals(periodId: string) {
    isLoading.value = true
    totals.value = null
    try {
      totals.value = await periodService.totals(periodId)
    } finally {
      isLoading.value = false
    }
  }

  /** Une page de jours d'un agent ; le curseur vient de la page précédente. */
  const loadDaily = (periodId: string, userId: string, cursor?: string): Promise<PeriodDailyPageResponse> =>
    periodService.dailyTotals(periodId, { userId, cursor, limit: 31 })

  async function downloadReport(periodId: string, format: PeriodReportFormat) {
    if (!totals.value) return
    downloading.value = format
    try {
      const blob = await periodService.report(periodId, format)
      const url = URL.createObjectURL(blob)
      try { openDownload(url, reportFilename(totals.value.period, format)) }
      finally { setTimeout(() => URL.revokeObjectURL(url), 10_000) }
    } finally {
      downloading.value = null
    }
  }

  function resetData() {
    totals.value = null
  }

  return { totals, isLoading, downloading, loadTotals, loadDaily, downloadReport, resetData }
})
