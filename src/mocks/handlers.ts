import { http, HttpResponse } from 'msw'

import type {
  ConfirmTotpRequest,
  LoginChallengeResponse,
  LoginRequest,
  RefreshRequest,
  SessionResponse,
} from '@/types/auth'
import type { ApiProblemDetails } from '@/types/api'
import {
  findMockAuthUserByCredentials,
  findMockAuthUserById,
} from '@/mocks/auth-users'

const API_URL = import.meta.env.VITE_API_BASE_URL

const mockQrCode = `/qrcode.png`

export const handlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const credentials = (await request.json()) as LoginRequest
    const mockUser = findMockAuthUserByCredentials(
      credentials.email,
      credentials.password,
    )

    if (mockUser) {
      const response: LoginChallengeResponse = {
        userId: mockUser.user.id,
        ...(mockUser.firstTotpSetup
          ? { qrCode: mockQrCode }
          : {}),
      }

      return HttpResponse.json(response)
    }

    const problem: ApiProblemDetails = {
      title: 'Authentication failed',
      status: 401,
      detail: 'Adresse e-mail ou mot de passe incorrect.',
      code: 'INVALID_CREDENTIALS',
    }

    return HttpResponse.json(problem, {
      status: 401,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    })
  }),

  http.post(`${API_URL}/auth/totp/confirm`, async ({ request }) => {
    const payload = (await request.json()) as ConfirmTotpRequest
    const mockUser = findMockAuthUserById(payload.userId)

    if (!mockUser || payload.code !== mockUser.totpCode) {
      const problem: ApiProblemDetails = {
        title: 'Invalid TOTP',
        status: 401,
        detail: 'Le code de vérification est incorrect.',
        code: 'TOTP_INVALID',
      }

      return HttpResponse.json(problem, {
        status: 401,
        headers: {
          'Content-Type': 'application/problem+json',
        },
      })
    }

    const session: SessionResponse = {
      accessToken: `mock-access-token-${payload.userId}`,
      refreshToken: `mock-refresh-token-${payload.userId}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    }

    return HttpResponse.json(session)
  }),

  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const payload = (await request.json()) as RefreshRequest

    if (!payload.refreshToken.startsWith('mock-refresh-token')) {
      return HttpResponse.json(
        {
          title: 'Invalid refresh token',
          status: 401,
          code: 'REFRESH_TOKEN_INVALID',
        },
        { status: 401 },
      )
    }

    const session: SessionResponse = {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    }

    return HttpResponse.json(session)
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return new HttpResponse(null, {
      status: 204,
    })
  }),

  http.get(`${API_URL}/users/:userId`, ({ params }) => {
    const mockUser = findMockAuthUserById(String(params.userId))

    if (!mockUser) {
      const problem: ApiProblemDetails = {
        title: 'User not found',
        status: 404,
        detail: "L'utilisateur demandé n'existe pas.",
        code: 'NOT_FOUND',
      }

      return HttpResponse.json(problem, {
        status: 404,
        headers: {
          'Content-Type': 'application/problem+json',
        },
      })
    }

    return HttpResponse.json(mockUser.user)
  }),
]
