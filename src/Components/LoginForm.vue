<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import type { LoginRequest } from '@/types/auth'
interface Props {
  loading?: boolean
  errorMessage?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: null,
})

const emit = defineEmits<{
  submit: [credentials: LoginRequest]
}>()

const voirPassword = ref(false)

const credentials = reactive<LoginRequest>({
  email: '',
  password: '',
})

const validationError = ref<string | null>(null)

const displayedError = computed(() => {
  return validationError.value ?? props.errorMessage
})

function handleSubmit() {
  validationError.value = null

  const email = credentials.email.trim()

  if (!email || !credentials.password) {
    validationError.value = 'Veuillez renseigner votre adresse e-mail et votre mot de passe.'
    return
  }

  emit('submit', {
    email,
    password: credentials.password,
  })
}
</script>

<template>
  <v-form
    class="space-y-5"
    @submit.prevent="handleSubmit"
  >
    <v-alert
      v-if="displayedError"
      type="error"
      variant="tonal"
      density="comfortable"
      closable
    >
      {{ displayedError }}
    </v-alert>

    <v-text-field
      v-model="credentials.email"
      label="E-mail"
      type="email"
      name="email"
      autocomplete="email"
      placeholder="xxx@yahoo.fr"
      prepend-inner-icon="mdi-email-outline"
      :disabled="loading"
      hide-details="auto"
    />

    <v-text-field
      v-model="credentials.password"
      label="Mot de passe"
      :type="voirPassword ? 'text' : 'password'"
      name="password"
      autocomplete="current-password"
      placeholder="••••••••"
      prepend-inner-icon="mdi-lock-outline"
      :append-inner-icon="
        voirPassword
          ? 'mdi-eye-outline'
          : 'mdi-eye-off-outline'
      "
      :disabled="loading"
      hide-details="auto"
      @click:append-inner="voirPassword = !voirPassword"
    />

    <v-btn
      type="submit"
      color="primary"
      size="large"
      block
      :loading="loading"
      :disabled="loading"
    >
      {{ loading ? 'Connexion...' : 'Me connecter' }}
    </v-btn>
  </v-form>
</template>
