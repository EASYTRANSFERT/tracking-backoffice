<script setup lang="ts">
import { ref, watch } from 'vue'
import { fullName } from '@/utils/people'
import type { EnterpriseUser } from '@/types/administrator'

const props = defineProps<{ user: EnterpriseUser | null; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ submit: [reason: string | undefined, code: string]; cancel: [] }>()

const reason = ref('')
const code = ref('')
const validationError = ref<string | null>(null)

watch(() => props.user?.id, () => { reason.value = ''; code.value = ''; validationError.value = null })

function onCodeInput(value: string) { code.value = value.replace(/\D/g, '').slice(0, 6) }

function submit() {
  validationError.value = null
  if (!/^\d{6}$/.test(code.value)) { validationError.value = 'Saisissez le code à 6 chiffres de votre application d’authentification.'; return }
  // Motif facultatif : l'API journalise « Remplacement de téléphone » par défaut.
  emit('submit', reason.value.trim() || undefined, code.value)
}
</script>

<template>
  <v-dialog :model-value="Boolean(user)" persistent max-width="540">
    <v-card v-if="user" rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="warning-lighten-5" size="42"><v-icon color="warning" icon="mdi-cellphone-sync" /></v-avatar>
        Changer le téléphone de {{ fullName(user) }} ?
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <p class="text-sm text-[#535865]">
            L’appareil actif est révoqué immédiatement : l’ancien téléphone ne peut plus pointer, synchroniser ni renouveler sa session.
            Le compte repasse en attente d’activation ; la personne active ensuite son nouveau téléphone avec le code SMS envoyé au numéro du compte ({{ user.phone }}).
          </p>
          <v-alert type="warning" variant="tonal" density="compact">
            Les pointages pris hors ligne sur l’ancien téléphone et non synchronisés seront refusés : faites-le synchroniser avant, s’il fonctionne encore.
            Si le numéro change aussi, modifiez d’abord le compte.
          </v-alert>
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
          <v-textarea v-model="reason" label="Motif (facultatif)" placeholder="Ex. : téléphone cassé, remplacé le 28/10/2026." rows="2" auto-grow counter="500" maxlength="500" :disabled="loading" />
          <v-text-field :model-value="code" label="Code de vérification" hint="Code à 6 chiffres de votre application d’authentification" persistent-hint inputmode="numeric" autocomplete="one-time-code" prepend-inner-icon="mdi-shield-key-outline" :disabled="loading" @update:model-value="onCodeInput" />
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" :disabled="loading" @click="emit('cancel')">Annuler</v-btn>
          <v-btn type="submit" color="warning" variant="flat" :loading="loading">Autoriser le changement</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
