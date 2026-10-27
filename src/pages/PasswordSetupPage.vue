<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import AuthLayout from '@/Components/AuthLayout.vue'
import PasswordChangeForm from '@/Components/security/PasswordChangeForm.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { UpdatePasswordRequest } from '@/types/user'

/** Lien d'invitation reçu par courriel : /password/setup?token=… */
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const feedback = useUiFeedbackStore()
const { isLoading, errorMessage } = storeToRefs(authStore)

const token = computed(() => typeof route.query.token === 'string' ? route.query.token.trim() : '')

onMounted(() => authStore.clearError())

async function submit({ newPassword }: UpdatePasswordRequest) {
  if (!token.value) return
  if (!(await authStore.setupPassword(token.value, newPassword))) return
  feedback.success('Mot de passe défini : vous pouvez maintenant vous connecter.')
  await router.replace({ name: 'login' })
}
</script>

<template>
  <AuthLayout
    title="Mot de passe"
    description="Choisissez le mot de passe de votre compte. Vous configurerez ensuite la double authentification à la connexion."
  >
    <PasswordChangeForm
      v-if="token"
      setup
      :loading="isLoading"
      :error-message="errorMessage"
      @submit="submit"
    />

    <div v-else class="grid gap-4">
      <v-alert type="error" variant="tonal">Ce lien est incomplet ou invalide : ouvrez le lien reçu par courriel, ou demandez à l’opérateur de vous renvoyer une invitation.</v-alert>
      <v-btn variant="outlined" :to="{ name: 'login' }">Aller à la connexion</v-btn>
    </div>
  </AuthLayout>
</template>
