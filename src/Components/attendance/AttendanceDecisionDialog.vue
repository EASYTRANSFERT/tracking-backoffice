<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AttendanceDecision, AttendanceSession } from '@/types/attendance'

const props = defineProps<{
  modelValue: boolean
  session?: AttendanceSession
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [decision: AttendanceDecision]
}>()

const decision = ref<'validate' | 'reject'>('validate')
const reason = ref('')
const correctedClockOutAt = ref('')

const requiresCorrectedExit = computed(() =>
  props.session?.status === 'missingExit' && decision.value === 'validate',
)
const canSubmit = computed(() =>
  (decision.value !== 'reject' || Boolean(reason.value.trim())) &&
  (!requiresCorrectedExit.value || Boolean(correctedClockOutAt.value)),
)

watch(() => props.modelValue, (open) => {
  if (!open) return
  decision.value = 'validate'
  reason.value = ''
  correctedClockOutAt.value = ''
})

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!canSubmit.value) return
  emit('confirm', {
    decision: decision.value,
    reason: reason.value.trim() || undefined,
    correctedClockOutAt: correctedClockOutAt.value || undefined,
  })
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="px-6 pt-6">Décider du pointage</v-card-title>
      <v-card-subtitle class="px-6">{{ session?.agentName }} · {{ session?.siteName }}</v-card-subtitle>
      <v-card-text class="space-y-4 px-6 py-6">
        <v-btn-toggle v-model="decision" mandatory color="primary" divided class="w-full">
          <v-btn value="validate" class="flex-1" prepend-icon="mdi-check-circle-outline">Valider</v-btn>
          <v-btn value="reject" class="flex-1" prepend-icon="mdi-close-circle-outline">Rejeter</v-btn>
        </v-btn-toggle>
        <v-text-field
          v-if="requiresCorrectedExit"
          v-model="correctedClockOutAt"
          type="datetime-local"
          label="Heure de sortie corrigée"
          hint="Obligatoire pour une sortie manquante"
          persistent-hint
        />
        <v-textarea
          v-model="reason"
          label="Motif"
          :hint="decision === 'reject' ? 'Obligatoire pour un rejet' : 'Facultatif pour une validation'"
          persistent-hint
          rows="3"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="close">Annuler</v-btn>
        <v-btn color="primary" :disabled="!canSubmit" @click="submit">Enregistrer la décision</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
