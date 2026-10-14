<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { UpdatePasswordRequest } from '@/types/user'

withDefaults(defineProps<{ loading?: boolean; errorMessage?: string | null }>(), { loading: false, errorMessage: null })
const emit = defineEmits<{ submit: [payload: UpdatePasswordRequest] }>()
const valid = ref(false)
const visible = reactive({ current: false, next: false, confirmation: false })
const form = reactive({ currentPassword: '', newPassword: '', confirmation: '' })
const required = (value: string) => Boolean(value) || 'Ce champ est obligatoire.'
const strongPassword = (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value) || '8 caractères minimum, avec majuscule, minuscule et chiffre.'
const confirmationRule = (value: string) => value === form.newPassword || 'Les mots de passe ne correspondent pas.'
const canSubmit = computed(() => valid.value && form.newPassword === form.confirmation)

function submit() {
  if (!canSubmit.value) return
  emit('submit', { currentPassword: form.currentPassword, newPassword: form.newPassword })
}
</script>

<template>
  <v-form v-model="valid" class="grid gap-4" @submit.prevent="submit">
    <v-alert v-if="errorMessage" type="error" variant="tonal" closable>{{ errorMessage }}</v-alert>
    <v-text-field v-model="form.currentPassword" label="Mot de passe actuel" autocomplete="current-password" :type="visible.current ? 'text' : 'password'" :append-inner-icon="visible.current ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required]" :disabled="loading" @click:append-inner="visible.current = !visible.current" />
    <v-text-field v-model="form.newPassword" label="Nouveau mot de passe" autocomplete="new-password" :type="visible.next ? 'text' : 'password'" :append-inner-icon="visible.next ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required, strongPassword]" :disabled="loading" hint="8 caractères minimum, avec majuscule, minuscule et chiffre." persistent-hint @click:append-inner="visible.next = !visible.next" />
    <v-text-field v-model="form.confirmation" label="Confirmer le nouveau mot de passe" autocomplete="new-password" :type="visible.confirmation ? 'text' : 'password'" :append-inner-icon="visible.confirmation ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[required, confirmationRule]" :disabled="loading" @click:append-inner="visible.confirmation = !visible.confirmation" />
    <v-btn type="submit" color="primary" size="large" :loading="loading" :disabled="!canSubmit" prepend-icon="mdi-lock-reset">Modifier mon mot de passe</v-btn>
  </v-form>
</template>
