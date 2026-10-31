<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import { MIN_TOLERANCE_RADIUS_M, toleranceRadiusRule } from '@/utils/site-radius'
import type { TenantSettings } from '@/types/platform'

const props = defineProps<{ settings: TenantSettings; loading?: boolean }>()
const emit = defineEmits<{ submit: [settings: TenantSettings]; cancel: []; dirtyChange: [dirty: boolean] }>()

const form = ref()
const clone = (value: TenantSettings): TenantSettings => ({ ...value, retention: { ...value.retention } })
const data = reactive<TenantSettings>(clone(props.settings))

// Le formulaire repart des valeurs enregistrées quand elles changent (chargement, enregistrement).
watch(() => props.settings, (value) => { Object.assign(data, clone(value)); emit('dirtyChange', false) })
watch(data, () => emit('dirtyChange', true), { deep: true })

const isInteger = (value: unknown) => Number.isInteger(Number(value)) && String(value).trim() !== ''
const positive = (value: unknown) => (isInteger(value) && Number(value) > 0) || 'Entrez un nombre entier supérieur à 0'
const zeroOrMore = (value: unknown) => (isInteger(value) && Number(value) >= 0) || 'Entrez un nombre entier, 0 ou plus'

const toNumbers = (value: TenantSettings): TenantSettings => ({
  radiusM: Number(value.radiusM),
  lateToleranceMin: Number(value.lateToleranceMin),
  maxAccuracyM: Number(value.maxAccuracyM),
  missingExitAfterMin: Number(value.missingExitAfterMin),
  checksPerSession: Number(value.checksPerSession),
  retention: {
    selfieDays: Number(value.retention.selfieDays),
    dataYears: Number(value.retention.dataYears),
    anonymizeAfterYears: Number(value.retention.anonymizeAfterYears),
    exportDays: Number(value.retention.exportDays),
  },
})

async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('submit', toNumbers(data))
}

function reset() {
  Object.assign(data, clone(props.settings))
  form.value?.resetValidation()
  emit('dirtyChange', false)
  emit('cancel')
}
</script>

<template>
  <v-form ref="form" class="space-y-6" @submit.prevent="submit">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-check-outline" color="primary" /></v-avatar>
        <div><h2 class="text-base font-bold">Pointage</h2><p class="mt-1 text-xs font-normal text-[#747985]">Règles appliquées aux arrivées et aux départs des agents</p></div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
        <v-text-field v-model.number="data.radiusM" type="number" label="Rayon de tolérance" suffix="m" :min="MIN_TOLERANCE_RADIUS_M" :rules="[toleranceRadiusRule]" hint="Zone de tolérance proposée à la création d’un site." persistent-hint />
        <v-text-field v-model.number="data.lateToleranceMin" type="number" label="Tolérance de retard" suffix="min" :rules="[zeroOrMore]" hint="Délai après le début du créneau avant qu’une arrivée soit en retard." persistent-hint />
        <v-text-field v-model.number="data.maxAccuracyM" type="number" label="Précision GPS maximale" suffix="m" :rules="[positive]" hint="Au-delà, la position est jugée imprécise et le pointage est à vérifier." persistent-hint />
        <v-text-field v-model.number="data.missingExitAfterMin" type="number" label="Délai « sortie manquante »" suffix="min" :rules="[positive]" hint="Temps après la fin du créneau avant de signaler un départ non pointé." persistent-hint />
      </v-card-text>
    </v-card>


    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-database-clock-outline" color="primary" /></v-avatar>
        <div><h2 class="text-base font-bold">Conservation des données</h2><p class="mt-1 text-xs font-normal text-[#747985]">Les données plus anciennes sont supprimées ou anonymisées automatiquement</p></div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
        <v-text-field disabled v-model.number="data.retention.selfieDays" type="number" label="Selfies" suffix="jours" :rules="[positive]" hint="Durée de conservation des photos de pointage." persistent-hint />
        <v-text-field disabled v-model.number="data.retention.dataYears" type="number" label="Données de pointage" suffix="ans" :rules="[positive]" hint="Durée de conservation des pointages et des créneaux." persistent-hint />
        <v-text-field disabled v-model.number="data.retention.anonymizeAfterYears" type="number" label="Anonymisation" suffix="ans" :rules="[positive]" hint="Délai après lequel les données personnelles sont anonymisées." persistent-hint />
        <v-text-field disabled v-model.number="data.retention.exportDays" type="number" label="Fichiers d’export" suffix="jours" :rules="[positive]" hint="Durée de disponibilité des exports générés." persistent-hint />
      </v-card-text>
    </v-card>

    <div class="flex justify-end gap-3">
      <v-btn variant="text" :disabled="loading" @click="reset">Annuler</v-btn>
      <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" :loading="loading">Enregistrer</v-btn>
    </div>
  </v-form>
</template>
