<script setup lang="ts">
import { fullName } from '@/utils/people'
import { computed, ref, watch } from 'vue'
import { endsNextDay, shiftDurationLabel, timeOf, toDayKey, toSlot, type ScheduleDay } from '@/Components/sites/site-schedule'
import type { EnterpriseUser } from '@/types/administrator'
import type { AssignmentResponse, AssignmentSlot } from '@/types/assignment'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  members: EnterpriseUser[]
  days: ScheduleDay[]
  /** Jours appartenant à une période de l'équipe ; les autres ne se planifient pas. */
  isDayAllowed?: (dayKey: string) => boolean
  /** Créneau corrigé ; absent pour une nouvelle planification. */
  assignment?: AssignmentResponse | null
  presetUserIds?: string[]
  presetDays?: string[]
  loading?: boolean
  errorMessage?: string | null
}>()
const emit = defineEmits<{
  plan: [userIds: string[], slots: AssignmentSlot[]]
  reschedule: [slot: AssignmentSlot]
  cancelShift: []
}>()

const userIds = ref<string[]>([])
const dayKeys = ref<string[]>([])
const editDay = ref('')
const start = ref('07:00')
const end = ref('15:00')
const validationError = ref<string | null>(null)

const isEdit = computed(() => Boolean(props.assignment))
const memberOptions = computed(() => props.members.map((user) => ({ title: fullName(user), value: user.id })))
const memberName = computed(() => {
  const user = props.members.find((item) => item.id === props.assignment?.userId)
  return user ? fullName(user) : props.assignment?.userId
})
const allowed = (dayKey: string) => props.isDayAllowed?.(dayKey) ?? true
const nightShift = computed(() => endsNextDay(start.value, end.value))

watch(open, (isOpen) => {
  if (!isOpen) return
  validationError.value = null
  if (props.assignment) {
    editDay.value = toDayKey(new Date(props.assignment.startAt))
    start.value = timeOf(props.assignment.startAt)
    end.value = timeOf(props.assignment.endAt)
  } else {
    userIds.value = [...(props.presetUserIds ?? [])]
    dayKeys.value = (props.presetDays ?? []).filter(allowed)
    start.value = '07:00'
    end.value = '15:00'
  }
})

function selectWholeTeam() { userIds.value = props.members.map((user) => user.id) }

function submit() {
  validationError.value = null
  if (!start.value || !end.value) { validationError.value = 'Renseignez l’heure de prise et de fin de poste.'; return }
  if (start.value === end.value) { validationError.value = 'La fin de poste doit être différente de la prise de poste.'; return }
  if (isEdit.value) {
    if (!editDay.value) { validationError.value = 'Choisissez la journée du créneau.'; return }
    if (!allowed(editDay.value)) { validationError.value = 'Cette journée n’appartient à aucune période de l’équipe.'; return }
    emit('reschedule', toSlot(editDay.value, start.value, end.value))
    return
  }
  if (!userIds.value.length) { validationError.value = 'Choisissez au moins un agent.'; return }
  if (!dayKeys.value.length) { validationError.value = 'Choisissez au moins un jour.'; return }
  const ordered = props.days.filter((day) => dayKeys.value.includes(day.key) && allowed(day.key))
  emit('plan', userIds.value, ordered.map((day) => toSlot(day.key, start.value, end.value)))
}
</script>

<template>
  <v-dialog v-model="open" max-width="560" :persistent="loading">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="red-lighten-5" size="42"><v-icon color="primary" :icon="isEdit ? 'mdi-calendar-edit' : 'mdi-calendar-plus'" /></v-avatar>
        {{ isEdit ? 'Corriger le créneau' : 'Planifier des créneaux' }}
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>

          <template v-if="isEdit">
            <p class="text-sm text-[#535865]">Créneau de <strong>{{ memberName }}</strong>. Pour le confier à un autre agent, annulez-le puis planifiez-en un nouveau.</p>
            <v-text-field v-model="editDay" type="date" label="Journée" :disabled="loading" />
          </template>
          <template v-else>
            <div>
              <v-autocomplete v-model="userIds" :items="memberOptions" label="Agents" multiple chips closable-chips :disabled="loading" hide-details />
              <v-btn variant="text" size="small" color="primary" class="mt-1 px-1" @click="selectWholeTeam">Toute l’équipe</v-btn>
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-[#252830]">Jours</p>
              <v-chip-group v-model="dayKeys" multiple column selected-class="!bg-[#D80F16] !text-white">
                <v-chip v-for="day in days" :key="day.key" :value="day.key" variant="outlined" filter :disabled="!allowed(day.key)">{{ day.weekday }} {{ day.date }}</v-chip>
              </v-chip-group>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-3">
            <v-text-field v-model="start" type="time" label="Prise de poste" :disabled="loading" hide-details />
            <v-text-field v-model="end" type="time" label="Fin de poste" :disabled="loading" hide-details />
          </div>
          <v-alert v-if="nightShift" type="warning" variant="tonal" icon="mdi-weather-night" density="comfortable" title="Poste de nuit">
            Ce créneau finit le lendemain à {{ end }} et dure {{ shiftDurationLabel(start, end) }}. Vérifiez l’heure de fin si ce n’est pas voulu.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-btn v-if="isEdit" variant="text" color="error" :disabled="loading" @click="emit('cancelShift')">Annuler le créneau</v-btn>
          <v-spacer />
          <v-btn variant="text" :disabled="loading" @click="open = false">Fermer</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="loading">{{ isEdit ? 'Enregistrer' : 'Planifier' }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
