<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import AppCopyableValue from '@/Components/common/AppCopyableValue.vue'
import type { LoginRequest } from '@/types/auth'
import { roleLabelByRole, type UserRole } from '@/types/roles'
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

// Mode démo : un compte visiteur par profil (comptes des mocks, src/mocks/auth-users.ts)
const visitorCredentialsByRole: Record<UserRole, LoginRequest> = {
  operator: {
    email: 'operateur@kaybic.africa',
    password: 'Password123!',
  },
  administrator: {
    email: 'admin@entreprise.test',
    password: 'Password123!',
  },
  supervisor: {
    email: 'superviseur@entreprise.test',
    password: 'Password123!',
  },
}

const visitorRoleOptions = (Object.keys(roleLabelByRole) as UserRole[]).map((role) => ({
  title: roleLabelByRole[role],
  value: role,
}))

const visitorRole = ref<UserRole>('operator')
const visitorCredentials = computed(() => visitorCredentialsByRole[visitorRole.value])

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

    <v-select
      v-model="visitorRole"
      label="Profil visiteur"
      :items="visitorRoleOptions"
      prepend-inner-icon="mdi-account-switch-outline"
      :disabled="loading"
      hide-details
    />

    <div>
      <v-text-field
        v-model="credentials.email"
        label="E-mail"
        type="email"
        name="email"
        autocomplete="username"
        placeholder="xxx@yahoo.fr"
        persistent-placeholder
        prepend-inner-icon="mdi-email-outline"
        :disabled="loading"
        hide-details="auto"
      />
      <AppCopyableValue
        class="mt-1"
        label="E-mail visiteur"
        :value="visitorCredentials.email"
      />
    </div>

    <div>
      <v-text-field
        v-model="credentials.password"
        label="Mot de passe"
        :type="voirPassword ? 'text' : 'password'"
        name="password"
        autocomplete="current-password"
        placeholder="••••••••"
        persistent-placeholder
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
      <AppCopyableValue
        class="mt-1"
        label="Mot de passe visiteur"
        :value="visitorCredentials.password"
      />
    </div>

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
