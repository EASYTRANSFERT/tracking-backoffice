<script setup lang="ts">
import { computed, ref } from 'vue'

import AppCopyableValue from '@/Components/common/AppCopyableValue.vue'

interface Props {
  qrCode?: string | null
  firstSetup?: boolean
  loading?: boolean
  errorMessage?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  qrCode: null,
  firstSetup: false,
  loading: false,
  errorMessage: null,
})

const emit = defineEmits<{
  confirm: [code: string]
  back: []
}>()

const code = ref('')

// Mode démo : code TOTP des comptes visiteurs (src/mocks/auth-users.ts), affiché sous le champ
const visitorTotpCode = '123456'
const validationError = ref<string | null>(null)

const displayedError = computed(() => {
  return validationError.value ?? props.errorMessage
})

function handleCodeInput(event: Event) {
  const input = event.target as HTMLInputElement

  code.value = input.value.replace(/\D/g, '').slice(0, 6)
}

function handleSubmit() {
  validationError.value = null

  if (!/^\d{6}$/.test(code.value)) {
    validationError.value =
      'Veuillez saisir le code à 6 chiffres de votre application.'
    return
  }

  emit('confirm', code.value)
}
</script>

<template>
  <v-form class="space-y-6" @submit.prevent="handleSubmit">
    <v-alert
      v-if="displayedError"
      role="alert"
    >
    <!--
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"-->
      {{ displayedError }}
  </v-alert>

    <div v-if="firstSetup" class="text-center">
      <p class="mb-5 text-sm leading-6 text-gray-600">
        Scannez ce QR code avec votre application d'authentification.
        Il ne sera affiché qu'une seule fois.
      </p>

      <div
        v-if="qrCode"
        class="mx-auto flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-white p-4"
      >
        <img
          :src="qrCode"
          alt="QR code de configuration de l'authentification"
          class="h-52 w-52 object-contain sm:h-60 sm:w-60"
        />
      </div>

      <div
        v-else
        role="alert"
        class="rounded-md bg-gray-100 px-4 py-8 text-sm text-gray-600"
      >
        Le QR code n'est pas disponible.
      </div>
    </div>

    <p
      v-else
      class="text-center text-sm leading-6 text-gray-600"
    >
      Saisissez le code généré par votre application
      d'authentification.
    </p>

    <div>
      <label
        for="totp-code"
        class="mb-2 block text-center text-sm font-medium text-gray-700"
      >
        Code de vérification
      </label>

      <input
        id="totp-code"
        :value="code"
        type="text"
        name="totp"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        placeholder="000000"
        :disabled="loading"
        autofocus
        class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
        @input="handleCodeInput"
      />
      <AppCopyableValue
        class="mx-auto mt-1"
        label="Code visiteur"
        :value="visitorTotpCode"
      />
    </div>

    <v-btn
      type="submit"
      color="primary"
      :disabled="loading || code.length !== 6"
      class="flex w-full items-center justify-center rounded-md bg-red-600 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-red-300"
    >
      <span
        v-if="loading"
        class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
        aria-hidden="true"
      />

      {{ loading ? 'Vérification...' : 'Confirmer' }}
  </v-btn>

    <v-btn
      type="button"
      :disabled="loading"
      class="w-full text-sm font-medium text-gray-600 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-400"
      @click="emit('back')"
    >
      Revenir à la connexion
    </v-btn>
  </v-form>
</template>
