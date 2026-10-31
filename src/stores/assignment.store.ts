import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { startOfWeek, weekRange } from '@/Components/sites/site-schedule'
import { assignmentService } from '@/Services/assignment.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import { readRejectedAssignmentReport } from '@/utils/assignment-import'
import { listAllPages } from '@/utils/pagination'
import type { EnterpriseUser } from '@/types/administrator'
import type { AssignmentImportReport, AssignmentResponse, AssignmentSlot, UpdateAssignmentRequest } from '@/types/assignment'

/** Planning d'un site : les membres de son équipe en lignes, les jours de la semaine en colonnes. */
export const useAssignmentStore = defineStore('assignment', () => {
  const siteId = ref<string | null>(null)
  const weekStart = ref(startOfWeek())
  const assignments = ref<AssignmentResponse[]>([])
  const members = ref<EnterpriseUser[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  /** Créneaux planifiés indexés par agent puis par journée. */
  const byMemberAndDay = computed(() => {
    const grid: Record<string, Record<string, AssignmentResponse[]>> = {}
    for (const assignment of assignments.value) {
      const days = (grid[assignment.userId] ??= {})
      ;(days[assignment.day] ??= []).push(assignment)
    }
    return grid
  })

  /** Seuls les agents de l'équipe du site peuvent y être planifiés. */
  async function loadTeamMembers(teamId: string) {
    members.value = await useAdministratorStore().listTeamMembers(teamId)
  }


  async function loadWeek(nextSiteId: string, nextWeekStart = weekStart.value) {
    siteId.value = nextSiteId
    weekStart.value = nextWeekStart
    isLoading.value = true
    try {
      const range = weekRange(nextWeekStart)
      const items = await listAllPages((page) => assignmentService.list({ ...page, siteId: nextSiteId, status: 'PLANNED', ...range }))
      // Ignore une réponse arrivée après un changement de semaine ou de site.
      if (siteId.value === nextSiteId && weekStart.value === nextWeekStart) assignments.value = items
    } finally {
      isLoading.value = false
    }
  }

  async function reload() {
    if (siteId.value) await loadWeek(siteId.value, weekStart.value)
  }

  async function plan(userIds: string[], slots: AssignmentSlot[]) {
    if (!siteId.value) throw new Error('Aucun site sélectionné.')
    isSaving.value = true
    try {
      const result = await assignmentService.create({ siteId: siteId.value, userIds, slots })
      await reload()
      return result.count
    } finally {
      isSaving.value = false
    }
  }

  async function reschedule(id: string, slot: AssignmentSlot) {
    isSaving.value = true
    try {
      const current = assignments.value.find((assignment) => assignment.id === id)
      const sameInstant = (a: string, b?: string) => b !== undefined && new Date(a).getTime() === new Date(b).getTime()
      const changes: UpdateAssignmentRequest = {}
      if (!sameInstant(slot.startAt, current?.startAt)) changes.startAt = slot.startAt
      if (!sameInstant(slot.endAt, current?.endAt)) changes.endAt = slot.endAt
      if (current && !Object.keys(changes).length) return current
      const updated = await assignmentService.update(id, changes)
      await reload()
      return updated
    } finally {
      isSaving.value = false
    }
  }

  async function cancel(id: string) {
    isSaving.value = true
    try {
      await assignmentService.cancel(id)
      assignments.value = assignments.value.filter((item) => item.id !== id)
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Import d'un classeur : simulation (dryRun) puis application. Un fichier refusé (422)
   * renvoie quand même son rapport ligne par ligne, pour l'afficher.
   */
  async function importFile(file: File, dryRun: boolean): Promise<AssignmentImportReport> {
    try {
      const report = await assignmentService.importFile(file, dryRun)
      if (report.applied) await reload()
      return report
    } catch (error) {
      const report = readRejectedAssignmentReport(error)
      if (report) return report
      throw error
    }
  }

  return {
    siteId, weekStart, assignments, members, isLoading, isSaving, byMemberAndDay,
    loadTeamMembers, loadWeek, reload, plan, reschedule, cancel, importFile,
  }
})
