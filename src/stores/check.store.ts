import { defineStore } from 'pinia'
import { ref } from 'vue'

import { checkService } from '@/Services/check.service'
import type { CheckScheduleResponse, CreateCheckScheduleRequest, UpdateCheckScheduleRequest } from '@/types/check'

/** Contrôles de présence : programmes ponctuels ou récurrents. */
export const useCheckStore = defineStore('check', () => {
  const schedules = ref<CheckScheduleResponse[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  /** Programme dont l'activation est en cours de bascule. */
  const togglingId = ref<string | null>(null)

  async function loadSchedules() {
    isLoading.value = true
    try { schedules.value = await checkService.listSchedules() }
    finally { isLoading.value = false }
  }

  const replace = (schedule: CheckScheduleResponse) => {
    schedules.value = schedules.value.map((item) => item.id === schedule.id ? schedule : item)
    return schedule
  }

  async function saving<T>(task: () => Promise<T>) {
    isSaving.value = true
    try { return await task() }
    finally { isSaving.value = false }
  }

  const createSchedule = (payload: CreateCheckScheduleRequest) => saving(async () => {
    const created = await checkService.createSchedule(payload)
    schedules.value = [created, ...schedules.value]
    return created
  })

  const updateSchedule = (id: string, payload: UpdateCheckScheduleRequest) => saving(async () => replace(await checkService.updateSchedule(id, payload)))

  async function setActive(id: string, active: boolean) {
    togglingId.value = id
    try { return replace(await checkService.updateSchedule(id, { active })) }
    finally { togglingId.value = null }
  }

  async function removeSchedule(id: string) {
    await checkService.removeSchedule(id)
    schedules.value = schedules.value.filter((item) => item.id !== id)
  }

  return { schedules, isLoading, isSaving, togglingId, loadSchedules, createSchedule, updateSchedule, setActive, removeSchedule }
})
