<script setup lang="ts">
import { nameOr } from '@/utils/people'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import WeekNavigator from '@/Components/sites/WeekNavigator.vue'
import { formatTime, fromDayKey, toDayKey } from '@/Components/sites/site-schedule'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAssignmentStore } from '@/stores/assignment.store'
import type { Site, Team } from '@/types/administrator'

/**
 * Planning d'un site en liste, par journée : consultation seule (superviseur).
 * Source : GET /assignments. L'API ne publie pas encore de pointages à valider.
 */
const props = defineProps<{ site: Site; team?: Team }>()

const store = useAssignmentStore()
const { assignments, members, weekStart, isLoading } = storeToRefs(store)
const loadError = ref<string | null>(null)

const memberById = computed(() => new Map(members.value.map((member) => [member.id, member])))
const today = toDayKey(new Date())
// Créneau de nuit : il se termine le lendemain de sa prise de poste.
const isNightShift = (startAt: string, endAt: string) => toDayKey(new Date(endAt)) !== toDayKey(new Date(startAt))
const dayLabel = (key: string) => {
  const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromDayKey(key))
  return label.charAt(0).toUpperCase() + label.slice(1)
}
const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
}
const agentName = (userId: string) => {
  const member = memberById.value.get(userId)
  return nameOr(member, 'Agent')
}

/** Créneaux de la semaine regroupés par journée, dans l'ordre chronologique. */
const days = computed(() => {
  const groups = new Map<string, typeof assignments.value>()
  for (const shift of [...assignments.value].sort((a, b) => a.startAt.localeCompare(b.startAt))) {
    const list = groups.get(shift.day) ?? []
    list.push(shift)
    groups.set(shift.day, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, shifts]) => ({ key, shifts }))
})

async function load() {
  loadError.value = null
  if (!props.site.teamId) { members.value = []; assignments.value = []; return }
  try {
    await Promise.all([store.loadTeamMembers(props.site.teamId), store.loadWeek(props.site.id, weekStart.value)])
  } catch (error) {
    loadError.value = getApiErrorMessage(error, 'Impossible de charger le planning du site.')
  }
}

async function goToWeek(nextWeekStart: string) {
  loadError.value = null
  try { await store.loadWeek(props.site.id, nextWeekStart) }
  catch (error) { loadError.value = getApiErrorMessage(error, 'Impossible de charger cette semaine.') }
}

watch(() => [props.site.id, props.site.teamId], load, { immediate: true })
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div class="flex items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-calendar-account-outline" color="primary" /></v-avatar>
        <div>
          <h2 class="text-base font-bold text-[#252830]">Planning</h2>
          <p class="mt-0.5 text-xs text-[#747985]">{{ team ? team.name : 'Aucune équipe affectée' }}</p>
        </div>
      </div>
      <div v-if="site.teamId" class="flex flex-wrap items-center gap-3">
        <WeekNavigator :week-start="weekStart" @change="goToWeek" />
      </div>
    </div>
    <v-divider />
    <v-progress-linear v-if="isLoading" indeterminate color="primary" height="2" />

    <AppEmptyState v-if="!site.teamId" icon="mdi-account-group-outline" title="Aucune équipe sur ce site" description="L’administrateur doit affecter une équipe à ce site." />
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="ma-6" :text="loadError" />
    <AppEmptyState v-else-if="!days.length && !isLoading" icon="mdi-calendar-blank-outline" title="Aucun créneau cette semaine" description="Aucun agent n’est planifié sur ce site pendant cette semaine." />

    <div v-else class="divide-y divide-[#eceef2]">
      <section v-for="day in days" :key="day.key">
        <div class="flex items-center gap-2 px-6 py-3" :class="day.key === today ? 'bg-[#FDE9EA]' : 'bg-[#FAFAFB]'">
          <span class="text-sm font-semibold" :class="day.key === today ? 'text-[#D80F16]' : 'text-[#252830]'">{{ dayLabel(day.key) }}</span>
          <v-chip v-if="day.key === today" size="x-small" color="primary" variant="flat">Aujourd’hui</v-chip>
          <span class="ml-auto text-xs text-[#848484]">{{ day.shifts.length }} créneau{{ day.shifts.length > 1 ? 'x' : '' }}</span>
        </div>
        <ul>
          <li v-for="shift in day.shifts" :key="shift.id" class="flex items-center gap-4 border-t border-[#f1f2f5] px-6 py-3 first:border-t-0">
            <span class="w-[120px] shrink-0 text-sm font-semibold tabular-nums text-[#252830]">{{ formatTime(shift.startAt) }} – {{ formatTime(shift.endAt) }}</span>
            <span class="min-w-0 flex-1 truncate text-sm text-[#3f434d]">
              {{ agentName(shift.userId) }}
              <v-chip v-if="shift.userId === team?.leadUserId" size="x-small" color="primary" variant="tonal" class="ml-1">Chef d’équipe</v-chip>
            </span>
            <span v-if="isNightShift(shift.startAt, shift.endAt)" class="flex items-center gap-1 text-xs text-[#4B5A86]"><v-icon icon="mdi-weather-night" size="14" />Nuit</span>
            <span class="w-[60px] shrink-0 text-right text-xs text-[#848484]">{{ duration(shift.durationMin) }}</span>
          </li>
        </ul>
      </section>
    </div>

  </v-card>
</template>
