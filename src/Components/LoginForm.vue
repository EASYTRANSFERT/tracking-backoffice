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
    validationError.value =
      'Veuillez renseigner votre adresse e-mail et votre mot de passe.'
    return
  }

  emit('submit', {
    email,
    password: credentials.password,
  })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div
      v-if="displayedError"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ displayedError }}
    </div>

    <div>
      <label
        for="email"
        class="mb-2 block text-sm font-medium text-gray-700"
      >
        E-mail
      </label>

      <input
        id="email"
        v-model="credentials.email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="xxx@yahoo.fr"
        :disabled="loading"
        required
        class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
    </div>

    <div>
      <label
        for="password"
        class="mb-2 block text-sm font-medium text-gray-700"
      >
        Mot de passe
      </label>

      <input
        id="password"
        v-model="credentials.password"
        :type="voirPassword ? 'text' : 'password'"
        name="password"
        autocomplete="current-password"
        placeholder="••••••••"
        :disabled="loading"
        required
        class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      <button type="button" :aria-label="voirPassword ? 'Masquer le mot de passe': 'Afficher le mot de passe'"
    </button>
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="flex w-full items-center justify-center rounded-md bg-red-600 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
    >
      <span
        v-if="loading"
        class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
        aria-hidden="true"
      />

      {{ loading ? 'Connexion...' : 'Me connecter' }}
    </button>
  </form>
</template>
