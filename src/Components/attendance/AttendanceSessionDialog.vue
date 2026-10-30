<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import SelfieViewer from '@/Components/attendance/SelfieViewer.vue'
import {
  checkResultConfig,
  flagLabels,
  formatDateTime,
  formatMinutes,
  isDecidable,
  statusLabels,
  validationConfig,
} from '@/Components/attendance/attendance-labels'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { WorkSessionResponse } from '@/types/attendance'

/**
 * Examen d'une session : détail, anomalies, contrôles de présence et selfies pour tous ;
 * décision pour le superviseur seulement.
 */
const props = defineProps<{
  modelValue: boolean
  session?: WorkSessionResponse
  siteName: string
  canDecide?: boolean
  /** Lien vers la page Régularisations, session déjà choisie (administrateur). */
  canAdjust?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useAttendanceStore()
const feedback = useUiFeedbackStore()
const decision = ref<'VALIDATE' | 'REJECT'>('VALIDATE')
const reason = ref('')

// La liste peut dater : on relit la session à l'ouverture (GET /sessions/{id}).
const current = computed(
  () => store.sessions.find((item) => item.id === props.session?.id) ?? props.session,
)
const checks = computed(() =>
  current.value ? (store.checksBySession.get(current.value.id) ?? []) : [],
)
const showDecision = computed(() => props.canDecide && current.value && isDecidable(current.value))
const canSubmit = computed(() => decision.value === 'VALIDATE' || reason.value.trim().length >= 3)

watch(
  () => props.modelValue,
  (open) => {
    if (!open || !props.session) return
    decision.value = 'VALIDATE'
    reason.value = ''
    store.loadSession(props.session.id).catch(() => undefined)
  },
)

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
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="current">
      <v-card-title class="flex items-center justify-between gap-3 px-6 pt-6">
        <span class="p-3">Examen du pointage</span>
        <v-chip size="small" variant="tonal" :color="validationConfig[current.validation].color">{{
          validationConfig[current.validation].label
        }}</v-chip>
      </v-card-title>
      <v-card-subtitle class="px-6"
        >{{ store.agentName(current.userId) }} · {{ siteName }}</v-card-subtitle
      >
      <v-card-text class="space-y-6 px-6 py-6">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-[#848484]">Entrée</p>
            <p class="mt-1 font-medium">{{ formatDateTime(current.inAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-[#848484]">Sortie</p>
            <p class="mt-1 font-medium">{{ formatDateTime(current.outAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-[#848484]">Session</p>
            <p class="mt-1 font-medium">{{ statusLabels[current.status] }}</p>
          </div>
          <div>
            <p class="text-xs text-[#848484]">Durée travaillée</p>
            <p class="mt-1 font-medium">{{ formatMinutes(current.minutes) }}</p>
          </div>
          <div>
            <p class="text-xs text-[#848484]">Retard</p>
            <p class="mt-1 font-medium">
              {{ current.lateMin ? formatMinutes(current.lateMin) : 'Aucun' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[#848484]">Départ anticipé</p>
            <p class="mt-1 font-medium">
              {{ current.earlyMin ? formatMinutes(current.earlyMin) : 'Aucun' }}
            </p>
          </div>
          <div v-if="current.validatedAt" class="sm:col-span-3">
            <p class="text-xs text-[#848484]">Décision</p>
            <p class="mt-1 font-medium">
              {{ validationConfig[current.validation].label }} le
              {{ formatDateTime(current.validatedAt)
              }}<template v-if="current.validatedBy">
                par {{ store.agentName(current.validatedBy) }}</template
              >
            </p>
          </div>
        </div>

        <div>
          <p class="text-xs text-[#848484]">Anomalies</p>
          <div v-if="current.flags.length" class="mt-2 flex flex-wrap gap-2">
            <v-chip
              v-for="flag in current.flags"
              :key="flag"
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="mdi-alert-outline"
              >{{ flagLabels[flag] ?? flag }}</v-chip
            >
          </div>
          <p v-else class="mt-1 text-sm text-[#535865]">Aucune anomalie détectée.</p>
        </div>

        <SelfieViewer
          :key="current.id"
          title="Selfie du pointage"
          :load="() => store.loadSelfie(current!.id)"
          unavailable-message="Aucun selfie disponible pour ce pointage."
        />

        <div v-if="checks.length">
          <p class="text-xs text-[#848484]">Contrôles de présence</p>
          <div class="mt-2 space-y-3">
            <div
              v-for="check in checks"
              :key="check.id"
              class="rounded-lg border border-[#eceef2] p-4"
            >
              <div class="flex flex-wrap items-center gap-2">
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="checkResultConfig[check.result].color"
                  :prepend-icon="checkResultConfig[check.result].icon"
                  >{{ checkResultConfig[check.result].label }}</v-chip
                >
                <v-chip
                  v-if="check.remote"
                  size="small"
                  variant="tonal"
                  color="warning"
                  prepend-icon="mdi-map-marker-off-outline"
                  title="Le chef d’équipe a répondu sans être sur le site."
                  >À distance</v-chip
                >
              </div>
              <dl class="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-xs text-[#848484]">Lancé par</dt>
                  <dd class="font-medium">
                    {{
                      check.triggeredBy ? store.agentName(check.triggeredBy, 'Utilisateur') : '—'
                    }}, le {{ formatDateTime(check.dueAt) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[#848484]">Échéance</dt>
                  <dd class="font-medium">{{ formatDateTime(check.deadlineAt) }}</dd>
                </div>
                <div v-if="check.answeredAt" class="sm:col-span-2">
                  <dt class="text-xs text-[#848484]">Réponse</dt>
                  <dd class="font-medium">
                    {{ formatDateTime(check.answeredAt)
                    }}<template v-if="check.attestedBy">
                      par {{ store.agentName(check.attestedBy, 'Chef d’équipe') }}</template
                    >
                  </dd>
                </div>
              </dl>
              <!-- L'API ne rend de selfie que pour un contrôle répondu (ni en attente, ni absent). -->
              <SelfieViewer
                v-if="check.result === 'ANSWERED'"
                :key="check.id"
                class="mt-3"
                title="Selfie du contrôle"
                :load="() => store.loadCheckSelfie(check.id)"
                unavailable-message="Aucun selfie rattaché à ce contrôle."
                :show-notice="false"
              />
            </div>
          </div>
        </div>

        <template v-if="showDecision">
          <v-divider />
          <v-btn-toggle v-model="decision" mandatory color="primary" divided class="w-full">
            <v-btn value="VALIDATE" class="flex-1" prepend-icon="mdi-check-circle-outline"
              >Valider</v-btn
            >
            <v-btn value="REJECT" class="flex-1" prepend-icon="mdi-close-circle-outline"
              >Rejeter</v-btn
            >
          </v-btn-toggle>
          <v-textarea
            v-model="reason"
            label="Motif"
            :hint="
              decision === 'REJECT'
                ? 'Obligatoire pour un rejet : l’agent lira ce texte.'
                : 'Facultatif pour une validation'
            "
            persistent-hint
            rows="3"
            counter="500"
            maxlength="500"
          />
        </template>
        <p v-else-if="canDecide && current.status === 'OPEN'" class="text-sm text-[#747985]">
          La session est encore en cours : elle pourra être décidée une fois la sortie pointée.
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-btn v-if="canAdjust && current" variant="text" color="primary" prepend-icon="mdi-clipboard-edit-outline" :to="{ name: 'admin-adjustments', query: { sessionId: current.id } }">Régulariser</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{
          showDecision ? 'Annuler' : 'Fermer'
        }}</v-btn>
        <v-btn
          v-if="showDecision"
          color="primary"
          :disabled="!canSubmit"
          :loading="store.isDeciding"
          @click="submit"
          >Enregistrer la décision</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
