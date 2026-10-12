import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'

import { authService } from '@/Services/auth.service'
import { userService } from '@/Services/user.service'
import { getDashboardRoles } from '@/types/roles'

import type {
  LoginRequest,
  SessionResponse,
} from '@/types/auth'
import type { ApiProblemDetails } from '@/types/api'
import type { UserRole } from '@/types/roles'
import type { UserResponse } from '@/types/user'

export type AuthStep =
  | 'credentials'
  | 'totp'
  | 'authenticated'

export const useAuthStore = defineStore('auth', () => {
  const step = ref<AuthStep>('credentials')

  const userId = ref<string | null>(null)
  const qrCode = ref<string | null>(null)
  const currentUser = shallowRef<UserResponse | null>(null)
  const activeRole = ref<UserRole | null>(null)

  const session = shallowRef<SessionResponse | null>(null)
  const accessTokenExpiresAt = ref<number | null>(null)

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const accessToken = computed(() => {
    return session.value?.accessToken ?? null
  })

  const refreshToken = computed(() => {
    return session.value?.refreshToken ?? null
  })

  const isAuthenticated = computed(() => {
    return (
      step.value === 'authenticated' &&
      Boolean(accessToken.value) &&
      Boolean(currentUser.value) &&
      Boolean(activeRole.value)
    )
  })

  const availableRoles = computed(() => {
    return getDashboardRoles(currentUser.value?.roles ?? [])
  })

  const isFirstMfaSetup = computed(() => {
    return Boolean(qrCode.value)
  })

  async function login(
    credentials: LoginRequest,
  ): Promise<boolean> {
    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await authService.login(credentials)

      userId.value = response.userId
      qrCode.value = response.qrCode ?? null
      step.value = 'totp'

      return true
    } catch (error) {
      errorMessage.value = getErrorMessage(error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function confirmTotp(code: string): Promise<boolean> {
    const challengeUserId = userId.value

    if (!challengeUserId) {
      errorMessage.value =
        "La tentative de connexion n'est plus valide. Veuillez recommencer."

      resetAuthentication()
      return false
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await authService.confirmTotp({
        userId: challengeUserId,
        code,
      })

      applySession(response)

      const authenticatedUser = await userService.findOne(
        challengeUserId,
      )
      const dashboardRoles = getDashboardRoles(
        authenticatedUser.roles,
      )

      if (authenticatedUser.status !== 'ACTIVE') {
        resetAuthentication()
        errorMessage.value =
          "Ce compte n'est pas actif. Veuillez contacter votre administrateur."
        return false
      }

      if (dashboardRoles.length === 0) {
        resetAuthentication()
        errorMessage.value =
          "Ce profil n'a pas accès au back-office."
        return false
      }

      if (dashboardRoles.length > 1) {
        resetAuthentication()
        errorMessage.value =
          'Ce compte possède plusieurs profils. La sélection du profil est requise.'
        return false
      }

      currentUser.value = authenticatedUser
      activeRole.value = dashboardRoles[0]!

      qrCode.value = null
      userId.value = null
      step.value = 'authenticated'

      return true
    } catch (error) {
      const message = getErrorMessage(error)

      if (accessToken.value) {
        resetAuthentication()
      }

      errorMessage.value = message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function refreshSession(): Promise<string | null> {
    const currentRefreshToken = refreshToken.value

    if (!currentRefreshToken) {
      clearSession()
      return null
    }

    try {
      const response = await authService.refresh({
        refreshToken: currentRefreshToken,
      })

      /*
       * The API rotates refresh tokens. Replacing the entire session
       * is mandatory. Do not keep the previous refresh token.
       */
      applySession(response)

      return response.accessToken
    } catch {
      clearSession()
      return null
    }
  }

  async function logout(): Promise<void> {
    const currentRefreshToken = refreshToken.value

    try {
      if (currentRefreshToken) {
        await authService.logout({
          refreshToken: currentRefreshToken,
        })
      }
    } finally {
      resetAuthentication()
    }
  }

  function applySession(response: SessionResponse) {
    session.value = response

    accessTokenExpiresAt.value =
      Date.now() + response.expiresIn * 1000
  }

  function clearSession() {
    session.value = null
    accessTokenExpiresAt.value = null
    currentUser.value = null
    activeRole.value = null
    step.value = 'credentials'
  }

  function resetAuthentication() {
    clearSession()

    userId.value = null
    qrCode.value = null
    errorMessage.value = null
  }

  function clearError() {
    errorMessage.value = null
  }

  function getErrorMessage(error: unknown): string {
    if (isAxiosError<ApiProblemDetails>(error)) {
      const problem = error.response?.data

      if (problem?.detail) {
        return problem.detail
      }

      if (problem?.title) {
        return problem.title
      }

      switch (problem?.code) {
        case 'INVALID_CREDENTIALS':
          return 'Adresse e-mail ou mot de passe incorrect.'

        case 'ACCOUNT_DISABLED':
          return 'Ce compte a été désactivé.'

        case 'TENANT_SUSPENDED':
          return "L'accès de votre entreprise a été suspendu."

        case 'ACCOUNT_LOCKED':
          return 'Ce compte est temporairement verrouillé.'

        case 'LOGIN_CHALLENGE_REQUIRED':
          return 'Veuillez recommencer la procédure de connexion.'

        case 'TOTP_INVALID':
          return 'Le code de vérification est incorrect.'

        case 'REFRESH_TOKEN_INVALID':
        case 'REFRESH_TOKEN_REPLAYED':
          return 'Votre session a expiré. Veuillez vous reconnecter.'

        default:
          return 'Impossible de communiquer avec le serveur.'
      }
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'Une erreur inattendue est survenue.'
  }

  return {
    step,
    userId,
    qrCode,
    currentUser,
    activeRole,
    availableRoles,
    session,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    isLoading,
    errorMessage,
    isAuthenticated,
    isFirstMfaSetup,
    login,
    confirmTotp,
    refreshSession,
    logout,
    resetAuthentication,
    clearSession,
    clearError,
  }
})
