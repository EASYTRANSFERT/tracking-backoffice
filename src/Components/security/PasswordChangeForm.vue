<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { UpdatePasswordRequest } from '@/types/user'

/** setup : premier mot de passe depuis le lien d'invitation, sans mot de passe actuel (currentPassword reste vide). */
const props = withDefaults(defineProps<{ loading?: boolean; errorMessage?: string | null; setup?: boolean }>(), { loading: false, errorMessage: null, setup: false })
const emit = defineEmits<{ submit: [payload: UpdatePasswordRequest] }>()
const valid = ref(false)
const visible = reactive({ current: false, next: false, confirmation: false })
const form = reactive({ currentPassword: '', newPassword: '', confirmation: '' })
const required = (value: string) => Boolean(value) || 'Ce champ est obligatoire.'
const strongPassword = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/.test(value) || '12 caractères minimum, avec majuscule, minuscule et chiffre.'
// Recalculé à chaque saisie dans l'un ou l'autre champ : rien n'est envoyé tant qu'ils diffèrent.
const mismatch = computed(() => Boolean(form.confirmation) && form.confirmation !== form.newPassword)
const canSubmit = computed(() => valid.value && Boolean(form.confirmation) && !mismatch.value)

function submit() {
  if (!canSubmit.value) return
  emit('submit', { currentPassword: props.setup ? '' : form.currentPassword, newPassword: form.newPassword })
}
</script>

<template>
  <v-form v-model="valid" class="grid gap-4" @submit.prevent="submit">
    <v-alert v-if="errorMessage" type="error" variant="tonal" closable>{{ errorMessage }}</v-alert>
    <v-text-field v-if="!setup" v-model="form.currentPassword" color="secondary" label="Mot de passe actuel" autocomplete="current-password" :type="visible.current ? 'text' : 'password'" :append-inner-icon="visible.current ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required]" :disabled="loading" @click:append-inner="visible.current = !visible.current" />
    <v-text-field v-model="form.newPassword" color="secondary" :label="setup ? 'Mot de passe' : 'Nouveau mot de passe'" autocomplete="new-password" :type="visible.next ? 'text' : 'password'" :append-inner-icon="visible.next ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required, strongPassword]" :disabled="loading" hint="12 caractères minimum, avec majuscule, minuscule et chiffre." persistent-hint @click:append-inner="visible.next = !visible.next" />
    <v-text-field v-model="form.confirmation" color="secondary" :label="setup ? 'Confirmer le mot de passe' : 'Confirmer le nouveau mot de passe'" autocomplete="new-password" :type="visible.confirmation ? 'text' : 'password'" :append-inner-icon="visible.confirmation ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required]" :error-messages="mismatch ? 'Les mots de passe ne correspondent pas.' : []" :disabled="loading" @click:append-inner="visible.confirmation = !visible.confirmation" />
    <v-btn type="submit" color="primary" size="large" :loading="loading" :disabled="!canSubmit" prepend-icon="mdi-lock-reset">{{ setup ? 'Définir mon mot de passe' : 'Modifier mon mot de passe' }}</v-btn>
  </v-form>
</template>
