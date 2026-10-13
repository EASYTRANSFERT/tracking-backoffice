import { apiClient, publicApiClient } from './api-client'

import type {
  AccessTokenResponse,
  ConfirmTotpRequest,
  LoginChallengeResponse,
  LoginRequest,
  RefreshRequest,
  SessionResponse,
  TotpCodeRequest,
} from '@/types/auth'

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
      )

    return response.data
  },

  async logout(payload: RefreshRequest): Promise<void> {
    await publicApiClient.post('/auth/logout', payload)
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
