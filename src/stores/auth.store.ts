import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'

import { SessionExpiredError } from '@/Services/api-client'
import { getApiErrorMessage } from '@/utils/api-error'
import { authService } from '@/Services/auth.service'
import { authSessionStorage } from '@/Services/auth-session.storage'
import { readAccessTokenClaims } from '@/Services/access-token'
import { tenantService } from '@/Services/tenant.service'
import { userService } from '@/Services/user.service'
import { getDashboardRoles } from '@/types/roles'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useAuditStore } from '@/stores/audit.store'
import { usePeriodStore } from '@/stores/period.store'
import { useOperatorStore } from '@/stores/operator.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

import type {
  LoginRequest,
  SessionResponse,
} from '@/types/auth'
import type { TenantResponse } from '@/types/platform'
import type { UserRole } from '@/types/roles'
import type { UserResponse } from '@/types/user'
import type { UpdatePasswordRequest } from '@/types/user'

const SESSION_EXPIRED_MESSAGE = 'Votre session a expiré, reconnectez-vous.'

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
  const tenant = shallowRef<TenantResponse | null>(null)

  const session = shallowRef<SessionResponse | null>(null)
  const accessTokenExpiresAt = ref<number | null>(null)

  const isLoading = ref(false)
  const isRestoringSession = ref(false)
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
      errorMessage.value = getApiErrorMessage(error, 'Connexion impossible.')
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

      applySession(response, challengeUserId)

      const authenticatedUser = await userService.findOne(
        challengeUserId,
      )

      if (!activateUser(authenticatedUser)) return false

      qrCode.value = null
      userId.value = null
      step.value = 'authenticated'
      useUiFeedbackStore().unmuteErrors()
      void loadTenant()

      return true
    } catch (error) {
      const message = getApiErrorMessage(error, 'Vérification impossible.')

      if (accessToken.value) {
        resetAuthentication()
      }

      errorMessage.value = message
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Renouvelle le jeton d'accès (15 min) avec le jeton de renouvellement
   * (30 jours). L'API fait tourner le jeton de renouvellement : la réponse
   * remplace toute la session, l'ancien jeton n'est plus valable.
   * Lève SessionExpiredError si le serveur refuse ; relance les erreurs réseau.
   */
  async function refreshSession(): Promise<string> {
    const usedRefreshToken = refreshToken.value
    const sessionUserId = currentUser.value?.id ?? userId.value

    if (!usedRefreshToken || !sessionUserId) throw new SessionExpiredError()

    return authSessionStorage.withRefreshLock(async () => {
      const stored = authSessionStorage.read()

      // Déconnexion, ou autre compte connecté, depuis un autre onglet.
      if (!stored || stored.userId !== sessionUserId) throw new SessionExpiredError()

      // Un autre onglet a déjà renouvelé la session pendant l'attente du verrou :
      // on reprend ses jetons au lieu de renvoyer un jeton déjà consommé.
      if (stored.session.refreshToken !== usedRefreshToken) {
        session.value = stored.session
        accessTokenExpiresAt.value = stored.accessTokenExpiresAt
        return stored.session.accessToken
      }

      try {
        const response = await authService.refresh({ refreshToken: usedRefreshToken })
        applySession(response, sessionUserId)
        return response.accessToken
      } catch (error) {
        if (isRefreshRejected(error)) throw new SessionExpiredError()
        throw error
      }
    })
  }

  /**
   * Jeton de renouvellement expiré, révoqué ou rejoué : 401 (REFRESH_TOKEN_REPLAYED, jeton invalide) ou 403.
   * Les autres statuts (404/429 d'un tunnel ou d'une passerelle, 408, 5xx, délai dépassé, réseau)
   * ne prouvent rien sur le jeton : la session est gardée et la requête échoue seule.
   */
  function isRefreshRejected(error: unknown): boolean {
    if (!isAxiosError(error)) return false
    const status = error.response?.status
    return status === 401 || status === 403
  }

  /**
   * Un autre onglet a renouvelé, remplacé ou fermé la session : on s'aligne sur lui.
   * Renvoie false si la session de cet onglet n'existe plus (déconnexion, autre compte).
   */
  function syncFromStorage(): boolean {
    if (step.value !== 'authenticated') return true

    const stored = authSessionStorage.read()
    if (!stored || stored.userId !== currentUser.value?.id) return false

    session.value = stored.session
    accessTokenExpiresAt.value = stored.accessTokenExpiresAt
    return true
  }

  /**
   * Fin de session imposée : aucune erreur n'est affichée sur la page en cours,
   * seul le message de la page de connexion informe l'utilisateur.
   */
  function expireSession(): void {
    resetAuthentication()
    useUiFeedbackStore().muteErrors()
    errorMessage.value = SESSION_EXPIRED_MESSAGE
  }

  function logout(): void {
    const currentRefreshToken = refreshToken.value

    // Local logout must never depend on network latency. Keep the token in a
    // local variable, clear all browser state first, then revoke it remotely
    // as a best-effort background request.
    resetAuthentication()

    if (currentRefreshToken) {
      void authService.logout({
        refreshToken: currentRefreshToken,
      }).catch(() => {
        // The browser session is already closed. A backend/network failure
        // must not restore it or prevent navigation to the login page.
      })
    }
  }

  /**
   * Ré-authentification TOTP pour une opération sensible. Lève l'erreur de l'API
   * telle quelle : c'est l'appelant qui la formule dans le contexte de son action.
   */
  async function stepUp(code: string): Promise<void> {
    if (!session.value || !currentUser.value) throw new Error('Votre session n’est plus active.')

    const response = await authService.stepUp({ code })
    applySession({
      ...session.value,
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresIn: response.expiresIn,
    }, currentUser.value.id)
  }

  async function changePassword(payload: UpdatePasswordRequest): Promise<boolean> {
    if (!currentUser.value) return false
    isLoading.value = true
    errorMessage.value = null
    try {
      await userService.updatePassword(currentUser.value.id, payload)
      return true
    } catch (error) {
      errorMessage.value = getApiErrorMessage(error, 'Impossible de modifier le mot de passe.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Premier mot de passe d'un compte, choisi depuis le lien d'invitation. */
  async function setupPassword(token: string, password: string): Promise<boolean> {
    isLoading.value = true
    errorMessage.value = null
    try {
      await authService.setupPassword({ token, password })
      return true
    } catch (error) {
      // 401 PASSWORD_SETUP_TOKEN_INVALID : lien expiré ou déjà utilisé, l'API ne permet pas d'en redemander un.
      errorMessage.value = isAxiosError(error) && error.response?.status === 401
        ? 'Ce lien n’est plus valide : demandez à l’opérateur de vous renvoyer une invitation.'
        : getApiErrorMessage(error, 'Impossible de définir le mot de passe.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function restoreSession(): Promise<boolean> {
    const persistedSession = authSessionStorage.read()

    if (!persistedSession) return false

    isRestoringSession.value = true

    try {
      userId.value = persistedSession.userId
      session.value = persistedSession.session
      accessTokenExpiresAt.value = persistedSession.accessTokenExpiresAt

      // Refresh slightly before expiry so the first protected request is reliable.
      if (persistedSession.accessTokenExpiresAt <= Date.now() + 30_000) {
        await refreshSession()
      }

      const authenticatedUser = await userService.findOne(persistedSession.userId)

      if (!activateUser(authenticatedUser)) return false

      userId.value = null
      qrCode.value = null
      step.value = 'authenticated'
      void loadTenant()
      return true
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        expireSession()
      } else {
        // Panne réseau au démarrage : la session enregistrée est gardée pour le prochain chargement.
        clearSession({ keepStoredSession: true })
      }
      return false
    } finally {
      isRestoringSession.value = false
    }
  }

  // L'identifiant de l'entreprise (tid) est porté par le jeton d'accès.
  async function loadTenant() {
    const tenantId = readAccessTokenClaims(accessToken.value)?.tid
    if (!tenantId || activeRole.value === 'operator') return

    try {
      tenant.value = await tenantService.findForProfile(tenantId)
    } catch (error) {
      // Le nom de l'entreprise est un complément d'affichage : son absence ne bloque pas la session.
      // La console garde la cause (ex. 403 : rôle sans accès à GET /platform/tenants/{id}).
      console.warn('Nom de l’entreprise indisponible :', isAxiosError(error) ? `${error.response?.status ?? 'réseau'} ${error.config?.url}` : error)
      tenant.value = null
    }
  }

  function activateUser(authenticatedUser: UserResponse): boolean {
    const dashboardRoles = getDashboardRoles(authenticatedUser.roles)

    if (authenticatedUser.status !== 'ACTIVE') {
      clearSession()
      errorMessage.value =
        "Ce compte n'est pas actif. Veuillez contacter votre administrateur."
      return false
    }

    if (dashboardRoles.length === 0) {
      clearSession()
      errorMessage.value = "Ce profil n'a pas accès au back-office."
      return false
    }

    if (dashboardRoles.length > 1) {
      clearSession()
      errorMessage.value =
        'Ce compte possède plusieurs profils. La sélection du profil est requise.'
      return false
    }

    currentUser.value = authenticatedUser
    activeRole.value = dashboardRoles[0]!
    return true
  }

  function applySession(response: SessionResponse, sessionUserId?: string) {
    session.value = response

    accessTokenExpiresAt.value =
      Date.now() + response.expiresIn * 1000

    if (sessionUserId) {
      authSessionStorage.write({
        userId: sessionUserId,
        session: response,
        accessTokenExpiresAt: accessTokenExpiresAt.value,
      })
    }
  }

  function clearSession(options: { keepStoredSession?: boolean } = {}) {
    session.value = null
    accessTokenExpiresAt.value = null
    currentUser.value = null
    activeRole.value = null
    tenant.value = null
    step.value = 'credentials'
    if (!options.keepStoredSession) authSessionStorage.clear()
    useOperatorStore().resetData()
    useAdministratorStore().resetData()
    useSupervisorStore().reset()
    useAuditStore().resetData()
    usePeriodStore().resetData()
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

  return {
    step,
    userId,
    qrCode,
    currentUser,
    activeRole,
    tenant,
    session,
    accessTokenExpiresAt,
    isLoading,

    //computed
    isRestoringSession,
    refreshToken,
    errorMessage,
    isAuthenticated,
    isFirstMfaSetup,
    accessToken,
    availableRoles,
    

    //methods
    login,
    confirmTotp,
    refreshSession,
    syncFromStorage,
    restoreSession,
    stepUp,
    changePassword,
    setupPassword,
    logout,
    expireSession,
    resetAuthentication,
    clearSession,
    clearError,
  }
})
