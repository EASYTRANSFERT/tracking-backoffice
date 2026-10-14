<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import PasswordChangeForm from '@/Components/security/PasswordChangeForm.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { dashboardRouteByRole } from '@/types/roles'
import type { UpdatePasswordRequest } from '@/types/user'

const auth = useAuthStore()
const feedback = useUiFeedbackStore()
const router = useRouter()
const { activeRole, errorMessage, isLoading } = storeToRefs(auth)

async function submit(payload: UpdatePasswordRequest) {
  if (!(await auth.changePassword(payload))) return
  feedback.success('Votre mot de passe a été modifié.')
  if (activeRole.value) await router.replace({ name: dashboardRouteByRole[activeRole.value] })
}
</script>

<template>
  <div class="mx-auto w-full max-w-[760px]">
    <PageHeader>
      <template #title>Sécurité du compte</template>
      <template #description>Modifiez votre mot de passe de connexion.</template>
      <template #actions><span /></template>
    </PageHeader>
    <v-card>
      <v-card-title class="px-6 pt-6">Changer le mot de passe</v-card-title>
      <v-card-subtitle class="px-6">Cette action utilise le point d’accès sécurisé de votre profil.</v-card-subtitle>
      <v-card-text class="px-6 pb-6 pt-6"><PasswordChangeForm :loading="isLoading" :error-message="errorMessage" @submit="submit" /></v-card-text>
    </v-card>
  </div>
</template>
