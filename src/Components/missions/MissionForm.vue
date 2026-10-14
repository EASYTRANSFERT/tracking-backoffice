<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import type { Mission, MissionInput } from '@/types/administrator'

const props = defineProps<{ mission?: Mission; loading?: boolean }>()
const emit = defineEmits<{
  submit: [payload: MissionInput]
  cancel: []
  dirtyChange: [dirty: boolean]
}>()

const form = ref()
const data = reactive<MissionInput>({
  code: props.mission?.code ?? '',
  title: props.mission?.title ?? '',
  startAt: props.mission?.startAt?.slice(0, 16) ?? '',
  endAt: props.mission?.endAt?.slice(0, 16) ?? '',
  notes: props.mission?.notes ?? '',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const validPeriod = () => !data.startAt || !data.endAt || data.endAt > data.startAt || 'La fin doit être postérieure au début'

watch(data, () => emit('dirtyChange', true), { deep: true })

async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { ...data })
}
</script>

<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg">
          <v-icon icon="mdi-clipboard-edit-outline" color="primary" />
        </v-avatar>
        <div>
          <h2 class="text-base font-bold">Informations de la mission</h2>
          <p class="mt-1 text-xs font-normal text-[#747985]">Référence, objet et période d’intervention</p>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
        <v-text-field v-model="data.code" label="Référence" placeholder="MIS-2026-001" :rules="[required]" />
        <v-text-field v-model="data.title" label="Intitulé de la mission" :rules="[required]" />
        <v-text-field v-model="data.startAt" label="Début prévisionnel" type="datetime-local" :rules="[validPeriod]" />
        <v-text-field v-model="data.endAt" label="Fin prévisionnelle" type="datetime-local" :rules="[validPeriod]" />
        <v-textarea v-model="data.notes" label="Description" rows="4" class="md:col-span-2" />
        <v-alert class="md:col-span-2" type="info" variant="tonal">
          Les affectations de site, d’équipe et de superviseur ne sont pas proposées ici car elles ne font pas partie du contrat actuel de l’API Missions.
        </v-alert>
      </v-card-text>
    </v-card>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn variant="outlined" color="secondary" size="large" :disabled="loading" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn>
      <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading">
        {{ mission ? 'Enregistrer les modifications' : 'Planifier la mission' }}
      </v-btn>
    </div>
  </v-form>
</template>
