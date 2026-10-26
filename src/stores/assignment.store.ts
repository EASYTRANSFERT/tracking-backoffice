import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { addDays, fromDayKey, startOfWeek } from '@/Components/sites/site-schedule'
import { assignmentService } from '@/Services/assignment.service'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { EnterpriseUser } from '@/types/administrator'
import type { AssignmentResponse, AssignmentSlot } from '@/types/assignment'

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
      const from = fromDayKey(nextWeekStart).toISOString()
      const to = fromDayKey(addDays(nextWeekStart, 7)).toISOString()
      const items: AssignmentResponse[] = []
      let cursor: string | undefined
      do {
        const page = await assignmentService.list({ siteId: nextSiteId, status: 'PLANNED', from, to, cursor, limit: 200 })
        items.push(...page.items)
        cursor = page.nextCursor ?? undefined
      } while (cursor)
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
      const updated = await assignmentService.update(id, slot)
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

  return {
    siteId, weekStart, assignments, members, isLoading, isSaving, byMemberAndDay,
    loadTeamMembers, loadWeek, reload, plan, reschedule, cancel,
  }
})
