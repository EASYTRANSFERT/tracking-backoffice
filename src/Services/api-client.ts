import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ApiProblemDetails } from '@/types/api'

export interface ApiAuthProvider {
  getAccessToken: () => string | null
  /**
   * Renouvelle la session et renvoie le nouveau jeton d'accès.
   * Lève SessionExpiredError si le serveur refuse le jeton de renouvellement ;
   * toute autre erreur (réseau, 5xx) est relancée telle quelle.
   */
  refreshSession: () => Promise<string>
  onSessionExpired: () => void
}

/** La session ne peut plus être renouvelée : l'utilisateur doit se reconnecter. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Votre session a expiré, reconnectez-vous.')
    this.name = 'SessionExpiredError'
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /** A 401 on this request is returned as-is: no refresh, no forced logout. */
    skipAuthRefresh?: boolean
  }
}

/*
 * Code renvoyé par l'API pour un jeton d'accès expiré, invalide ou absent.
 * Les autres 401 (TOTP_INVALID, STEP_UP_REQUIRED…) sont des refus métier :
 * ils remontent tels quels à la page, sans renouvellement de session.
 */
const EXPIRED_ACCESS_TOKEN_CODE = 'UNAUTHENTICATED'

/*
 * Délai maximal d'une requête. Sans lui, un renouvellement qui ne répond jamais
 * garderait le verrou inter-onglets pour toujours et plus aucune session ne se renouvellerait.
 */
export const REQUEST_TIMEOUT_MS = 30_000

const baseConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json, application/problem+json',
  },
}

/**
 * Used for endpoints that do not require an access token:
 * login, TOTP confirmation, refresh and logout.
 */
export const publicApiClient = axios.create(baseConfig)

/**
 * Used for endpoints protected by the Bearer access token.
 */
export const apiClient = axios.create(baseConfig)

let authProvider: ApiAuthProvider | null = null
let refreshPromise: Promise<string> | null = null

export function configureApiAuth(provider: ApiAuthProvider) {
  authProvider = provider
}

function bearer(accessToken: string) {
  return `Bearer ${accessToken}`
}

/** Code métier de l'erreur ; le corps d'une réponse en blob (téléchargement de fichier) est relu en JSON. */
async function readProblemCode(error: AxiosError<ApiProblemDetails>): Promise<string | undefined> {
  const data: unknown = error.response?.data

  if (data instanceof Blob) {
    try {
      return (JSON.parse(await data.text()) as ApiProblemDetails).code
    } catch {
      return undefined
    }
  }

  return (data as ApiProblemDetails | undefined)?.code
}

async function isExpiredAccessToken(error: AxiosError<ApiProblemDetails>) {
  return (
    error.response?.status === 401 &&
    (await readProblemCode(error)) === EXPIRED_ACCESS_TOKEN_CODE
  )
}

/** Un seul renouvellement à la fois : les 401 simultanés attendent le même. */
function refreshOnce(provider: ApiAuthProvider) {
  refreshPromise ??= provider.refreshSession().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const accessToken = authProvider?.getAccessToken()

  if (accessToken) {
    config.headers.set('Authorization', bearer(accessToken))
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<ApiProblemDetails>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const provider = authProvider

    if (
      !provider ||
      !originalRequest ||
      originalRequest._retry === true ||
      originalRequest.skipAuthRefresh === true ||
      !(await isExpiredAccessToken(error))
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    /*
     * Requête partie avec un ancien jeton alors que la session a déjà été
     * renouvelée entre-temps : on la rejoue avec le jeton actuel, sans
     * nouveau renouvellement.
     */
    const currentAccessToken = provider.getAccessToken()
    const sentAuthorization = originalRequest.headers.get('Authorization')

    if (currentAccessToken && sentAuthorization !== bearer(currentAccessToken)) {
      originalRequest.headers.set('Authorization', bearer(currentAccessToken))
      return apiClient(originalRequest)
    }

    try {
      const newAccessToken = await refreshOnce(provider)
      originalRequest.headers.set('Authorization', bearer(newAccessToken))
      return apiClient(originalRequest)
    } catch (refreshError) {
      if (refreshError instanceof SessionExpiredError) {
        provider.onSessionExpired()
      }

      // Erreur réseau pendant le renouvellement : la session est conservée,
      // la page reçoit l'erreur réseau et l'affiche comme d'habitude.
      return Promise.reject(refreshError)
    }
  },
)
