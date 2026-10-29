<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatPeriodRange } from '@/utils/period-format'
import type { PeriodBlockers, PeriodResponse } from '@/types/period'

/**
 * Clôture d'une période : code TOTP (step-up), et, s'il reste des sessions à valider (RG-17),
 * clôture forcée avec motif. Le dialogue n'émet que ce qu'il a recueilli : l'appel reste dans le store.
 */
const props = defineProps<{
  period: PeriodResponse | null
  /** Blocages connus : ceux de la période, ou ceux d'un refus 422. */
  blockers?: PeriodBlockers | null
  /** Vrai quand un step-up récent est déjà valide (après un refus de clôture) : le code n'est plus redemandé. */
  stepUpDone?: boolean
  /** Ouvert par « Forcer la clôture » : la clôture est forcée d'emblée, motif obligatoire, même sans blocage connu. */
  forced?: boolean
  loading?: boolean
  errorMessage?: string | null
}>()
const emit = defineEmits<{ submit: [payload: { code?: string; force: boolean; reason?: string }]; cancel: [] }>()

const code = ref('')
const reason = ref('')
const force = ref(false)
const validationError = ref<string | null>(null)

const blockedCount = computed(() => (props.blockers?.pending ?? 0) + (props.blockers?.open ?? 0))
const isBlocked = computed(() => blockedCount.value > 0)
const forcing = computed(() => Boolean(props.forced) || (isBlocked.value && force.value))

watch(() => props.period?.id, () => { code.value = ''; reason.value = ''; force.value = false; validationError.value = null })

function onCodeInput(value: string) { code.value = value.replace(/\D/g, '').slice(0, 6) }

function submit() {
  validationError.value = null
  if (isBlocked.value && !forcing.value) { validationError.value = 'Traitez les sessions bloquantes, ou choisissez de forcer la clôture.'; return }
  if (forcing.value && reason.value.trim().length < 5) { validationError.value = 'Indiquez le motif de la clôture forcée.'; return }
  if (!props.stepUpDone && !/^\d{6}$/.test(code.value)) { validationError.value = 'Saisissez le code à 6 chiffres de votre application d’authentification.'; return }
  emit('submit', { code: props.stepUpDone ? undefined : code.value, force: forcing.value, reason: forcing.value ? reason.value.trim() : undefined })
}
</script>

<template>
  <v-dialog :model-value="Boolean(period)" persistent max-width="560">
    <v-card v-if="period" rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar :color="isBlocked || forced ? 'error-lighten-5' : 'red-lighten-5'" size="42"><v-icon :color="isBlocked || forced ? 'error' : 'primary'" :icon="forced ? 'mdi-lock-alert-outline' : 'mdi-lock-check-outline'" /></v-avatar>
        {{ forced ? 'Forcer la clôture ?' : 'Clôturer la période ?' }}
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <p class="text-sm text-[#535865]">
            <strong>{{ formatPeriodRange(period) }}</strong> : une fois clôturée, la période est <strong>immuable</strong> et ses totaux sont figés.
            Elle ne peut plus être rouverte.
          </p>
          <v-alert v-if="isBlocked" type="warning" variant="tonal" density="compact">
            <p class="font-semibold">{{ blockedCount }} session{{ blockedCount > 1 ? 's' : '' }} empêche{{ blockedCount > 1 ? 'nt' : '' }} la clôture</p>
            <p class="text-sm">{{ blockers?.pending ?? 0 }} en attente de décision · {{ blockers?.open ?? 0 }} encore ouverte{{ (blockers?.open ?? 0) > 1 ? 's' : '' }}.</p>
          </v-alert>
          <template v-if="forced">
            <v-alert type="error" variant="tonal" density="compact">
              Les sessions non décidées seront figées sans décision et resteront <strong>hors des totaux</strong>. Cette action est définitive.
            </v-alert>
            <v-textarea v-model="reason" label="Motif de la clôture forcée" rows="2" auto-grow counter="500" maxlength="500" :disabled="loading" />
          </template>
          <template v-else-if="isBlocked">
            <v-switch v-model="force" color="error" hide-details label="Forcer la clôture malgré ces sessions" :disabled="loading" />
            <v-alert v-if="force" type="error" variant="tonal" density="compact">
              Ces sessions seront figées sans décision et resteront <strong>hors des totaux</strong>. Cette action est définitive.
            </v-alert>
            <v-textarea v-if="force" v-model="reason" label="Motif de la clôture forcée" rows="2" auto-grow counter="500" maxlength="500" :disabled="loading" />
          </template>
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
          <v-text-field v-if="!stepUpDone" :model-value="code" label="Code de vérification" hint="Code à 6 chiffres de votre application d’authentification" persistent-hint inputmode="numeric" autocomplete="one-time-code" prepend-inner-icon="mdi-shield-key-outline" :disabled="loading" @update:model-value="onCodeInput" />
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" :disabled="loading" @click="emit('cancel')">Annuler</v-btn>
          <v-btn type="submit" :color="forcing ? 'error' : 'primary'" variant="flat" :loading="loading">{{ forcing ? 'Forcer la clôture' : 'Clôturer' }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
