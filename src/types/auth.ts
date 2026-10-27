export interface LoginRequest {
  email: string
  password: string
}

export interface LoginChallengeResponse {
  userId: string
  qrCode?: string
}

export interface ConfirmTotpRequest {
  userId: string
  code: string
}

export interface SessionResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface RefreshRequest {
  refreshToken: string
}

export interface TotpCodeRequest {
  code: string
}

export interface AccessTokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

/** Mot de passe choisi depuis le lien d'invitation reçu par courriel. */
export interface SetupPasswordRequest {
  /** Jeton lu dans le lien (?token=), à usage unique et de durée limitée. */
  token: string
  password: string
}
