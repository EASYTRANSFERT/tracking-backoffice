<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import AuthLayout from '@/Components/AuthLayout.vue'
import LoginForm from '@/Components/LoginForm.vue'
import MfaChallenge from '@/Components/MfaChallenge.vue'

import { useAuthStore } from '@/stores/auth.store'
import { dashboardRouteByRole } from '@/types/roles'

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
  return step.value === 'credentials' ? 'Login' : ''
})

const cardDescription = computed(() => {
  if (step.value === 'credentials') {
    return 'Bienvenue sur la plateforme de traçabilité du personnel mobile'
  }

  if (isFirstMfaSetup.value) {
    return 'Configurez votre authentification à deux facteurs'
  }

  return 'Un instant vous allez accéder à la d\'acceuil...'
})

async function handleLogin(credentials: LoginRequest) {
  await authStore.login(credentials)
}

async function handleTotpConfirmation(code: string) {
  const authenticated =
    await authStore.confirmTotp(code)

  if (authenticated) {
    const destination = authStore.activeRole
      ? dashboardRouteByRole[authStore.activeRole]
      : 'unauthorized'

    await router.replace({
      name: destination,
    })
  }
}
</script>

<template>
  <AuthLayout
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
  </AuthLayout>
</template>
