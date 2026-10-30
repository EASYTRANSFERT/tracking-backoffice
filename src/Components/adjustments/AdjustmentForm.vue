<script setup lang="ts">
import { ref, watch } from 'vue'

import { buildAdjustmentRequest, toLocalInput } from '@/utils/adjustment-format'
import type { CreateAdjustmentRequest } from '@/types/adjustment'
import type { WorkSessionResponse } from '@/types/attendance'

/** Correction de l'entrée, de la sortie ou du retard d'une session. Le formulaire n'envoie que ce qui change. */
const props = defineProps<{ session: WorkSessionResponse; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ submit: [request: CreateAdjustmentRequest] }>()

const inAt = ref('')
const outAt = ref('')
const lateMin = ref<number | string | null>(null)
const reason = ref('')
const validationError = ref<string | null>(null)

// Repart de la session affichée : au changement de session, et après une régularisation (elle la modifie).
watch(
  () => [props.session.id, props.session.inAt, props.session.outAt, props.session.lateMin],
  () => {
    inAt.value = toLocalInput(props.session.inAt)
    outAt.value = toLocalInput(props.session.outAt)
    lateMin.value = props.session.lateMin ?? 0
    reason.value = ''
    validationError.value = null
  },
  { immediate: true },
)

function submit() {
  validationError.value = null
  const result = buildAdjustmentRequest(props.session, { inAt: inAt.value, outAt: outAt.value, lateMin: lateMin.value, reason: reason.value })
  if ('error' in result) { validationError.value = result.error; return }
  emit('submit', result.request)
}
</script>

<template>
  <v-form @submit.prevent="submit">
    <v-card-text class="space-y-4 px-6 py-6">
      <v-alert type="info" variant="tonal" density="compact">
        La durée se recalcule toute seule. Une régularisation ne se modifie pas : pour corriger une correction, enregistrez-en une nouvelle.
      </v-alert>
      <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
      <div class="grid gap-3 sm:grid-cols-2">
        <v-text-field v-model="inAt" type="datetime-local" label="Entrée" :disabled="loading" />
        <v-text-field v-model="outAt" type="datetime-local" label="Sortie" hint="Une sortie renseignée ferme la session" persistent-hint :disabled="loading" />
        <v-text-field v-model="lateMin" type="number" min="0" max="1440" label="Retard retenu (minutes)" hint="0 lève le retard" persistent-hint :disabled="loading" />
      </div>
      <v-textarea v-model="reason" label="Motif (obligatoire)" rows="3" auto-grow counter="500" maxlength="500" :disabled="loading" />
    </v-card-text>
    <v-card-actions class="justify-end px-6 pb-5">
      <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-clipboard-edit-outline" :loading="loading">Enregistrer la régularisation</v-btn>
    </v-card-actions>
  </v-form>
</template>
