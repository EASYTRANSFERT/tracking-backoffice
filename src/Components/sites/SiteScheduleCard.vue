<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { isAxiosError } from 'axios'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import SiteShiftDialog from '@/Components/sites/SiteShiftDialog.vue'
import { addDays, formatTime, startOfWeek, toDayKey, weekDays, weekLabel } from '@/Components/sites/site-schedule'
import { getApiErrorMessage } from '@/Services/api-error'
import { useAssignmentStore } from '@/stores/assignment.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site, Team } from '@/types/administrator'
import type { AssignmentResponse, AssignmentSlot } from '@/types/assignment'

const props = defineProps<{ site: Site; team?: Team }>()

const store = useAssignmentStore()
const feedback = useUiFeedbackStore()
const { members, weekStart, byMemberAndDay, isLoading, isSaving } = storeToRefs(store)
const days = computed(() => weekDays(weekStart.value))
const canPlan = computed(() => Boolean(props.site.teamId) && props.site.status !== 'inactive' && members.value.length > 0)
const loadError = ref<string | null>(null)

const dialogOpen = ref(false)
const editing = ref<AssignmentResponse | null>(null)
const presetUserIds = ref<string[]>([])
const presetDays = ref<string[]>([])
const dialogError = ref<string | null>(null)

const shiftsOf = (userId: string, day: string) => byMemberAndDay.value[userId]?.[day] ?? []
const endsNextDay = (shift: AssignmentResponse) => toDayKey(new Date(shift.endAt)) !== toDayKey(new Date(shift.startAt))
const totalHours = (userId: string) => {
  const minutes = Object.values(byMemberAndDay.value[userId] ?? {}).flat().reduce((sum, shift) => sum + shift.durationMin, 0)
  return minutes ? `${Math.round((minutes / 60) * 10) / 10} h` : '—'
}

async function load() {
  loadError.value = null
  if (!props.site.teamId) { members.value = []; return }
  try {
    await Promise.all([store.loadTeamMembers(props.site.teamId), store.loadWeek(props.site.id, weekStart.value)])
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Impossible de charger le planning du site.')
  }
}

async function goToWeek(nextWeekStart: string) {
  try { await store.loadWeek(props.site.id, nextWeekStart) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger cette semaine.')) }
}

function openPlan(userIds: string[] = [], dayKeys: string[] = []) {
  if (!canPlan.value) return
  editing.value = null
  presetUserIds.value = userIds
  presetDays.value = dayKeys
  dialogError.value = null
  dialogOpen.value = true
}

function openEdit(shift: AssignmentResponse) {
  if (props.site.status === 'inactive') return
  editing.value = shift
  dialogError.value = null
  dialogOpen.value = true
}

// L'API situe l'erreur sur l'agent en cause : on le nomme dans le message.
function describeError(error: unknown, fallback: string) {
  const message = getApiErrorMessage(error, fallback)
  const userId = isAxiosError<{ userId?: string }>(error) ? error.response?.data?.userId : undefined
  const user = members.value.find((item) => item.id === userId)
  return user ? `${message} (${user.firstName} ${user.lastName})` : message
}

async function plan(userIds: string[], slots: AssignmentSlot[]) {
  dialogError.value = null
  try {
    const count = await store.plan(userIds, slots)
    feedback.success(count > 1 ? `${count} créneaux planifiés.` : 'Créneau planifié.')
    dialogOpen.value = false
  } catch (error) {
    dialogError.value = describeError(error, 'Impossible de planifier ces créneaux.')
  }
}

async function reschedule(slot: AssignmentSlot) {
  if (!editing.value) return
  dialogError.value = null
  try {
    await store.reschedule(editing.value.id, slot)
    feedback.success('Créneau mis à jour.')
    dialogOpen.value = false
  } catch (error) {
    dialogError.value = describeError(error, 'Impossible de modifier ce créneau.')
  }
}

async function cancelShift() {
  if (!editing.value) return
  const confirmed = await feedback.askConfirmation({
    title: 'Annuler ce créneau ?',
    message: 'L’agent ne sera plus attendu sur ce site à cet horaire. Le créneau reste dans l’historique.',
    confirmText: 'Annuler le créneau', cancelText: 'Garder', color: 'error',
  })
  if (!confirmed) return
  try {
    await store.cancel(editing.value.id)
    feedback.success('Créneau annulé.')
    dialogOpen.value = false
  } catch (error) {
    dialogError.value = describeError(error, 'Impossible d’annuler ce créneau.')
  }
}

watch(() => [props.site.id, props.site.teamId], load, { immediate: true })
</script>

<template>
  <v-card class="overflow-hidden">
    <v-card-title class="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-calendar-account-outline" color="primary" /></v-avatar>
        <div>
          <h2 class="text-base font-bold">Planning de l’équipe</h2>
          <p class="mt-1 text-xs font-normal text-[#747985]">{{ team ? `${team.name} · ${members.length} agent${members.length > 1 ? 's' : ''}` : 'Aucune équipe affectée' }}</p>
        </div>
      </div>
      <div v-if="site.teamId" class="flex flex-wrap items-center gap-2">
        <v-btn icon="mdi-chevron-left" variant="text" size="small" aria-label="Semaine précédente" @click="goToWeek(addDays(weekStart, -7))" />
        <span class="min-w-[220px] text-center text-sm font-semibold text-[#252830]">{{ weekLabel(weekStart) }}</span>
        <v-btn icon="mdi-chevron-right" variant="text" size="small" aria-label="Semaine suivante" @click="goToWeek(addDays(weekStart, 7))" />
        <v-btn variant="outlined" color="secondary" size="small" @click="goToWeek(startOfWeek())">Aujourd’hui</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-calendar-plus" :disabled="!canPlan" @click="openPlan()">Planifier</v-btn>
      </div>
    </v-card-title>
    <v-divider />
    <v-progress-linear v-if="isLoading" indeterminate color="primary" />

    <AppEmptyState v-if="!site.teamId" icon="mdi-account-group-outline" title="Aucune équipe sur ce site" description="Affectez une équipe au site pour planifier les créneaux de ses agents.">
      <v-btn v-if="site.status !== 'inactive'" color="primary" variant="tonal" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-site-edit', params: { siteId: site.id } }">Affecter une équipe</v-btn>
    </AppEmptyState>
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="ma-6" :text="loadError" />
    <AppEmptyState v-else-if="!members.length && !isLoading" icon="mdi-account-off-outline" title="L’équipe n’a pas encore d’agent" description="Ajoutez des agents à l’équipe depuis la page Équipes." />

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[920px] border-collapse text-sm">
        <thead>
          <tr class="bg-[#F6F6F7]">
            <th class="relative h-16 w-52 border-b border-r border-[#e3e5ea] text-left">
              <svg class="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="0" x2="100%" y2="100%" stroke="#e3e5ea" /></svg>
              <span class="absolute right-3 top-2 text-xs font-semibold text-[#747985]">Jour</span>
              <span class="absolute bottom-2 left-3 text-xs font-semibold text-[#747985]">Agents</span>
            </th>
            <th v-for="day in days" :key="day.key" class="border-b border-r border-[#e3e5ea] px-2 py-2 text-center last:border-r-0" :class="day.isToday ? 'bg-[#FDE9EA]' : ''">
              <p class="text-xs font-semibold uppercase tracking-wide" :class="day.isToday ? 'text-[#D80F16]' : 'text-[#747985]'">{{ day.weekday }}</p>
              <p class="font-bold text-[#252830]">{{ day.date }}</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td class="border-b border-r border-[#e3e5ea] px-3 py-2 align-middle">
              <p class="font-semibold text-[#252830]">{{ member.firstName }} {{ member.lastName }}</p>
              <p class="text-xs text-[#848484]">{{ member.role === 'teamLeader' ? 'Chef d’équipe' : member.employeeNumber }} · {{ totalHours(member.id) }}</p>
            </td>
            <td v-for="day in days" :key="day.key" class="group h-16 border-b border-r border-[#e3e5ea] p-1.5 align-top last:border-r-0" :class="day.isToday ? 'bg-[#FFF8F8]' : ''">
              <div class="flex h-full flex-col gap-1">
                <button
                  v-for="shift in shiftsOf(member.id, day.key)"
                  :key="shift.id"
                  type="button"
                  class="flex items-center justify-center gap-1 rounded-lg bg-[#FDE9EA] px-2 py-1 text-xs font-semibold text-[#B00C12] transition hover:bg-[#F9D3D5]"
                  :title="`Corriger le créneau de ${member.firstName} ${member.lastName}`"
                  @click="openEdit(shift)"
                >
                  {{ formatTime(shift.startAt) }} – {{ formatTime(shift.endAt) }}
                  <v-icon v-if="endsNextDay(shift)" icon="mdi-weather-night" size="12" />
                </button>
                <button
                  v-if="canPlan"
                  type="button"
                  class="flex min-h-7 flex-1 items-center justify-center rounded-lg text-[#b8bcc6] opacity-0 transition hover:bg-[#F6F6F7] hover:text-[#D80F16] focus:opacity-100 group-hover:opacity-100"
                  :aria-label="`Planifier ${member.firstName} ${member.lastName} le ${day.weekday} ${day.date}`"
                  @click="openPlan([member.id], [day.key])"
                >
                  <v-icon icon="mdi-plus" size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SiteShiftDialog
      v-model="dialogOpen"
      :members="members"
      :days="days"
      :assignment="editing"
      :preset-user-ids="presetUserIds"
      :preset-days="presetDays"
      :loading="isSaving"
      :error-message="dialogError"
      @plan="plan"
      @reschedule="reschedule"
      @cancel-shift="cancelShift"
    />
  </v-card>
</template>
