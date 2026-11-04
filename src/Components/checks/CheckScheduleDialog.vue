<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { checkModeLabels, defaultScheduleName, formatInterval, INTERVAL_MAX, INTERVAL_MIN, scheduleDefaults } from '@/utils/check-schedule'
import type { Team } from '@/types/administrator'
import type { ApiCheckScheduleMode, CheckScheduleResponse, CreateCheckScheduleRequest } from '@/types/check'

/**
 * Programme de contrôles : une fois, chaque jour ou à intervalle. Un contrôle « une fois » n'est pas immédiat :
 * il se programme à un moment à venir. Les valeurs sont pré-remplies ; sans équipe choisie, toutes sont visées.
 */
const props = defineProps<{ modelValue: boolean; teams: Team[]; schedule?: CheckScheduleResponse; loading?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: CreateCheckScheduleRequest]
}>()

const modes = Object.keys(checkModeLabels) as ApiCheckScheduleMode[]
const form = ref()
const data = reactive({ mode: 'ONCE' as ApiCheckScheduleMode, name: '', date: '', time: '', everyMin: 90, startDate: '', endDate: '', teamIds: [] as string[] })

watch(() => props.modelValue, (open) => {
  if (!open) return
  const defaults = scheduleDefaults()
  const schedule = props.schedule
  Object.assign(data, {
    mode: schedule?.mode ?? 'ONCE',
    name: schedule?.name ?? '',
    date: schedule?.date ?? defaults.date,
    time: schedule?.time ?? defaults.time,
    everyMin: schedule?.everyMin ?? defaults.everyMin,
    startDate: schedule ? schedule.startDate ?? '' : defaults.startDate,
    endDate: schedule?.endDate ?? '',
    teamIds: [...(schedule?.teamIds ?? [])],
  })
})

const required = (value: string) => Boolean(value) || 'Obligatoire'
// L'API refuse un contrôle « une fois » à un moment déjà passé (CHECK_SCHEDULE_IN_PAST).
const upcoming = () => data.mode !== 'ONCE' || !data.date || !data.time || new Date(`${data.date}T${data.time}`) > new Date() || 'Choisissez un moment à venir'
const validInterval = (value: number | string) => (Number.isInteger(Number(value)) && Number(value) >= INTERVAL_MIN && Number(value) <= INTERVAL_MAX) || `Entre ${INTERVAL_MIN} et ${INTERVAL_MAX} min`
const endAfterStart = () => !data.startDate || !data.endDate || data.endDate >= data.startDate || 'Avant le début'

// Seuls les champs du mode choisi partent : l'API efface ceux d'un autre mode.
const draft = computed<Omit<CreateCheckScheduleRequest, 'name'>>(() => {
  const period = { startDate: data.startDate || undefined, endDate: data.endDate || undefined }
  if (data.mode === 'ONCE') return { mode: 'ONCE', date: data.date, time: data.time, teamIds: data.teamIds }
  if (data.mode === 'DAILY') return { mode: 'DAILY', time: data.time, ...period, teamIds: data.teamIds }
  return { mode: 'INTERVAL', everyMin: data.everyMin, ...period, teamIds: data.teamIds }
})
const suggestedName = computed(() => defaultScheduleName(draft.value))

async function submit() {
  if (!(await form.value?.validate())?.valid) return
  emit('submit', { ...draft.value, name: data.name.trim() || suggestedName.value })
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="px-6 pt-6"><h2 class="text-lg font-bold">{{ schedule ? 'Modifier le contrôle' : 'Nouveau contrôle' }}</h2></v-card-title>
      <v-form ref="form" @submit.prevent="submit">
        <v-card-text class="space-y-5 px-6 py-4">
          <v-btn-toggle v-model="data.mode" mandatory divided variant="outlined" color="primary" class="w-full gap-3">
            <v-btn v-for="mode in modes" :key="mode" :value="mode" class="flex-1">{{ checkModeLabels[mode] }}</v-btn>
          </v-btn-toggle>

          <div class="grid gap-x-4 gap-y-4 pt-3 sm:grid-cols-2">
            <v-text-field v-if="data.mode === 'ONCE'" v-model="data.date" type="date" label="Date" :rules="[required]" />
            <v-text-field v-if="data.mode !== 'INTERVAL'" v-model="data.time" type="time" label="Heure" :rules="[required, upcoming]" />
            <v-text-field
              v-if="data.mode === 'INTERVAL'"
              v-model.number="data.everyMin"
              type="number"
              :min="INTERVAL_MIN"
              :max="INTERVAL_MAX"
              label="Toutes les"
              suffix="min"
              class="sm:col-span-2"
              :hint="validInterval(data.everyMin) === true ? formatInterval(data.everyMin) : ''"
              persistent-hint
              :rules="[validInterval]"
            />
            <template v-if="data.mode !== 'ONCE'">
              <v-text-field v-model="data.startDate" type="date" label="Du" placeholder="Aujourd’hui" persistent-placeholder clearable />
              <v-text-field v-model="data.endDate" type="date" label="Au" placeholder="Sans fin" persistent-placeholder clearable :rules="[endAfterStart]" />
            </template>
          </div>

          <v-autocomplete
            v-model="data.teamIds"
            :items="teams"
            item-title="name"
            item-value="id"
            label="Équipes"
            placeholder="Toutes les équipes"
            persistent-placeholder
            multiple
            chips
            closable-chips
            :hint="data.teamIds.length ? undefined : 'Sans choix, toutes les équipes sont contrôlées.'"
            persistent-hint
            hide-details="auto"
            class="hint-strong"
            no-data-text="Aucune équipe"
          >
            <template #message="{ message }"><span class="text-primary">{{ message }}</span></template>
          </v-autocomplete>
          <v-text-field v-model="data.name" label="Nom" :placeholder="suggestedName" persistent-placeholder hide-details />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false)">Annuler</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="loading" prepend-icon="mdi-check">{{ schedule ? 'Enregistrer' : 'Programmer' }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
