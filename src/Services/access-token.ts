export interface AccessTokenClaims {
  sub?: string
  tid?: string
  roles?: string[]
}

// Lecture des claims sans vérification de signature : l'API reste seule juge de la validité du jeton.
export function readAccessTokenClaims(accessToken: string | null): AccessTokenClaims | null {
  const payload = accessToken?.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)))
    return JSON.parse(json) as AccessTokenClaims
  } catch {
    return null
  }
}
