<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { checkResultConfig, flagLabels, formatDateTime, formatMinutes, isDecidable, statusLabels, validationConfig } from '@/Components/attendance/attendance-labels'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { WorkSessionResponse } from '@/types/attendance'

/** Examen d'une session : détail, anomalies et selfie pour tous ; décision pour le superviseur seulement. */
const props = defineProps<{
  modelValue: boolean
  session?: WorkSessionResponse
  siteName: string
  canDecide?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useAttendanceStore()
const feedback = useUiFeedbackStore()
const decision = ref<'VALIDATE' | 'REJECT'>('VALIDATE')
const reason = ref('')
const selfieUrl = ref<string>()
const selfieError = ref<string>()
const isSelfieLoading = ref(false)

// La liste peut dater : on relit la session à l'ouverture (GET /sessions/{id}).
const current = computed(() => store.sessions.find((item) => item.id === props.session?.id) ?? props.session)
const check = computed(() => current.value ? store.latestCheckBySession.get(current.value.id) : undefined)
const showDecision = computed(() => props.canDecide && current.value && isDecidable(current.value))
const canSubmit = computed(() => decision.value === 'VALIDATE' || reason.value.trim().length >= 3)

watch(() => props.modelValue, (open) => {
  if (!open || !props.session) return
  decision.value = 'VALIDATE'
  reason.value = ''
  selfieUrl.value = undefined
  selfieError.value = undefined
  store.loadSession(props.session.id).catch(() => undefined)
})

// Chaque consultation du selfie est journalisée : on ne le charge que sur demande.
async function showSelfie() {
  if (!current.value) return
  isSelfieLoading.value = true
  selfieError.value = undefined
  try { selfieUrl.value = await store.loadSelfie(current.value.id) }
  catch (error) { selfieError.value = getApiErrorMessage(error, 'Aucun selfie disponible pour ce pointage.') }
  finally { isSelfieLoading.value = false }
}

async function submit() {
  if (!current.value || !canSubmit.value) return
  try {
    await store.decide(current.value.id, { decision: decision.value, reason: reason.value })
    feedback.success(decision.value === 'VALIDATE' ? 'Pointage validé.' : 'Pointage rejeté.')
    emit('update:modelValue', false)
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer la décision.'))
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="current">
      <v-card-title class="flex items-center justify-between gap-3 px-6 pt-6">
        <span class="p-3">Examen du pointage</span>
        <v-chip size="small" variant="tonal" :color="validationConfig[current.validation].color">{{ validationConfig[current.validation].label }}</v-chip>
      </v-card-title>
      <v-card-subtitle class="px-6">{{ store.agentName(current.userId) }} · {{ siteName }}</v-card-subtitle>
      <v-card-text class="space-y-6 px-6 py-6">
        <div class="grid gap-4 sm:grid-cols-3">
          <div><p class="text-xs text-[#848484]">Entrée</p><p class="mt-1 font-medium">{{ formatDateTime(current.inAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Sortie</p><p class="mt-1 font-medium">{{ formatDateTime(current.outAt) }}</p></div>
          <div><p class="text-xs text-[#848484]">Session</p><p class="mt-1 font-medium">{{ statusLabels[current.status] }}</p></div>
          <div><p class="text-xs text-[#848484]">Durée travaillée</p><p class="mt-1 font-medium">{{ formatMinutes(current.minutes) }}</p></div>
          <div><p class="text-xs text-[#848484]">Retard</p><p class="mt-1 font-medium">{{ current.lateMin ? formatMinutes(current.lateMin) : 'Aucun' }}</p></div>
          <div><p class="text-xs text-[#848484]">Départ anticipé</p><p class="mt-1 font-medium">{{ current.earlyMin ? formatMinutes(current.earlyMin) : 'Aucun' }}</p></div>
          <div v-if="check" class="sm:col-span-3"><p class="text-xs text-[#848484]">Contrôle de présence</p><p class="mt-1 font-medium">{{ checkResultConfig[check.result].label }} · lancé le {{ formatDateTime(check.dueAt) }}<template v-if="check.answeredAt">, réponse le {{ formatDateTime(check.answeredAt) }}<template v-if="check.remote"> (à distance)</template></template><template v-else>, échéance {{ formatDateTime(check.deadlineAt) }}</template></p></div>
          <div v-if="current.validatedAt" class="sm:col-span-3"><p class="text-xs text-[#848484]">Décision</p><p class="mt-1 font-medium">{{ validationConfig[current.validation].label }} le {{ formatDateTime(current.validatedAt) }}<template v-if="current.validatedBy"> par {{ store.agentName(current.validatedBy) }}</template></p></div>
        </div>

        <div>
          <p class="text-xs text-[#848484]">Anomalies</p>
          <div v-if="current.flags.length" class="mt-2 flex flex-wrap gap-2"><v-chip v-for="flag in current.flags" :key="flag" size="small" color="warning" variant="tonal" prepend-icon="mdi-alert-outline">{{ flagLabels[flag] ?? flag }}</v-chip></div>
          <p v-else class="mt-1 text-sm text-[#535865]">Aucune anomalie détectée.</p>
        </div>

        <div>
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-[#848484]">Selfie du pointage</p>
            <v-btn v-if="!selfieUrl" size="small" variant="tonal" color="primary" prepend-icon="mdi-camera-outline" :loading="isSelfieLoading" @click="showSelfie">Voir le selfie</v-btn>
          </div>
          <p class="mt-1 text-xs text-[#747985]">Chaque consultation est enregistrée ; le lien reste valable 5 minutes.</p>
          <v-img v-if="selfieUrl" :src="selfieUrl" max-height="320" class="mt-3 rounded-lg bg-[#f4f4f5]" alt="Selfie du pointage" />
          <p v-else-if="selfieError" class="mt-2 text-sm text-[#a76000]">{{ selfieError }}</p>
        </div>

        <template v-if="showDecision">
          <v-divider />
          <v-btn-toggle v-model="decision" mandatory color="primary" divided class="w-full">
            <v-btn value="VALIDATE" class="flex-1" prepend-icon="mdi-check-circle-outline">Valider</v-btn>
            <v-btn value="REJECT" class="flex-1" prepend-icon="mdi-close-circle-outline">Rejeter</v-btn>
          </v-btn-toggle>
          <v-textarea v-model="reason" label="Motif" :hint="decision === 'REJECT' ? 'Obligatoire pour un rejet : l’agent lira ce texte.' : 'Facultatif pour une validation'" persistent-hint rows="3" counter="500" maxlength="500" />
        </template>
        <p v-else-if="canDecide && current.status === 'OPEN'" class="text-sm text-[#747985]">La session est encore en cours : elle pourra être décidée une fois la sortie pointée.</p>
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{ showDecision ? 'Annuler' : 'Fermer' }}</v-btn>
        <v-btn v-if="showDecision" color="primary" :disabled="!canSubmit" :loading="store.isDeciding" @click="submit">Enregistrer la décision</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
