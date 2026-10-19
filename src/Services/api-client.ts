import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

export interface ApiAuthProvider {
  getAccessToken: () => string | null
  refreshSession: () => Promise<string | null>
  onSessionExpired: () => void
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

const baseConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
let refreshPromise: Promise<string | null> | null = null

export function configureApiAuth(provider: ApiAuthProvider) {
  authProvider = provider
}

apiClient.interceptors.request.use((config) => {
  const accessToken = authProvider?.getAccessToken()

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableRequestConfig
      | undefined

    /*
     * Copy the mutable module variable into a local constant.
     * TypeScript can safely narrow this value.
     */
    const provider = authProvider

    const shouldTryRefresh =
      error.response?.status === 401 &&
      originalRequest !== undefined &&
      originalRequest._retry !== true &&
      originalRequest.skipAuthRefresh !== true &&
      provider !== null

    if (!shouldTryRefresh || !provider || !originalRequest) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = provider
          .refreshSession()
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise

      if (!newAccessToken) {
        provider.onSessionExpired()
        return Promise.reject(error)
      }

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newAccessToken}`,
      )

      return apiClient(originalRequest)
    } catch {
      provider.onSessionExpired()
      return Promise.reject(error)
    }
  },
)
