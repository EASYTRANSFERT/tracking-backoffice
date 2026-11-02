import { apiClient, publicApiClient } from './api-client'

import type {
  AccessTokenResponse,
  ConfirmTotpRequest,
  LoginChallengeResponse,
  LoginRequest,
  RefreshRequest,
  SessionResponse,
  SetupPasswordRequest,
  TotpCodeRequest,
} from '@/types/auth'

/** Le renouvellement tient le verrou inter-onglets : il doit se terminer vite, même si le réseau est mort. */
const REFRESH_TIMEOUT_MS = 15_000

export const authService = {
  async login(
    payload: LoginRequest,
  ): Promise<LoginChallengeResponse> {
    const response =
      await publicApiClient.post<LoginChallengeResponse>(
        '/auth/login',
        payload,
      )

    return response.data
  },

  async confirmTotp(
    payload: ConfirmTotpRequest,
  ): Promise<SessionResponse> {
    const response =
      await publicApiClient.post<SessionResponse>(
        '/auth/totp/confirm',
        payload,
      )

    return response.data
  },

  async refresh(
    payload: RefreshRequest,
  ): Promise<SessionResponse> {
    const response =
      await publicApiClient.post<SessionResponse>(
        '/auth/refresh',
        payload,
        { timeout: REFRESH_TIMEOUT_MS },
      )

    return response.data
  },

  async logout(payload: RefreshRequest): Promise<void> {
    await publicApiClient.post('/auth/logout', payload)
  },

  async setupPassword(payload: SetupPasswordRequest): Promise<void> {
    await publicApiClient.post('/auth/password/setup', payload)
  },

  async stepUp(
    payload: TotpCodeRequest,
  ): Promise<AccessTokenResponse> {
    const response =
      await apiClient.post<AccessTokenResponse>(
        '/auth/step-up',
        payload,
      )

    return response.data
  },
}
