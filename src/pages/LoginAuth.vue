<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import AuthCard from '@/Components/AuthCard.vue'
import LoginForm from '@/Components/LoginForm.vue'
import MfaChallenge from '@/Components/Mfa.vue'
import ChangeImg from '@/Components/ChangeImg.vue'

import { useAuthStore } from '@/stores/auth.store'

import type { LoginRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const {
  step,
  qrCode,
  isLoading,
  errorMessage,
  isFirstMfaSetup,
} = storeToRefs(authStore)

const cardTitle = computed(() => {
  return step.value === 'credentials' ? 'Login' : 'MFA'
})

const cardDescription = computed(() => {
  if (step.value === 'credentials') {
    return 'Bienvenue sur la plateforme de traçabilité du personnel mobile'
  }

  if (isFirstMfaSetup.value) {
    return 'Configurez votre authentification à deux facteurs'
  }

  return 'Confirmez votre identité pour continuer'
})

async function handleLogin(credentials: LoginRequest) {
  await authStore.login(credentials)
}

async function handleTotpConfirmation(code: string) {
  const authenticated =
    await authStore.confirmTotp(code)

  if (authenticated) {
    await router.replace({
      name: 'dashboard',
    })
  }
}
</script>

<template>
  <main
    class="grid min-h-screen w-full grid-cols-1 bg-gray-100 md:grid-cols-2"
  >
    <section
      class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 md:min-h-0"
    >
      <img
        src="@/assets/background.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <AuthCard
        :title="cardTitle"
        :description="cardDescription"
      >
        <LoginForm
          v-if="step === 'credentials'"
          :loading="isLoading"
          :error-message="errorMessage"
          @submit="handleLogin"
        />

        <MfaChallenge
          v-else-if="step === 'totp'"
          :qr-code="qrCode"
          :first-setup="isFirstMfaSetup"
          :loading="isLoading"
          :error-message="errorMessage"
          @confirm="handleTotpConfirmation"
          @back="authStore.resetAuthentication"
        />
      </AuthCard>
    </section>

    <section
      class="relative hidden min-h-screen overflow-hidden md:block"
    >
      <ChangeImg />

      <div
        class="absolute inset-0 bg-black/5"
        aria-hidden="true"
      />
    </section>
  </main>
</template>
