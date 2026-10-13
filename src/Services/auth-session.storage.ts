import type { SessionResponse } from '@/types/auth'

const SESSION_STORAGE_KEY = 'kaybic.backoffice.session'
const SESSION_STORAGE_VERSION = 1

export interface PersistedAuthSession {
  version: typeof SESSION_STORAGE_VERSION
  userId: string
  session: SessionResponse
  accessTokenExpiresAt: number
}

function isPersistedAuthSession(value: unknown): value is PersistedAuthSession {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<PersistedAuthSession>

  return (
    candidate.version === SESSION_STORAGE_VERSION &&
    typeof candidate.userId === 'string' &&
    typeof candidate.accessTokenExpiresAt === 'number' &&
    typeof candidate.session?.accessToken === 'string' &&
    typeof candidate.session?.refreshToken === 'string' &&
    typeof candidate.session?.expiresIn === 'number'
  )
}

export const authSessionStorage = {
  read(): PersistedAuthSession | null {
    const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!rawSession) return null

    try {
      const parsedSession: unknown = JSON.parse(rawSession)

      if (isPersistedAuthSession(parsedSession)) return parsedSession
    } catch {
      // An unreadable session must never block application startup.
    }

    this.clear()
    return null
  },

  write(session: Omit<PersistedAuthSession, 'version'>) {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: SESSION_STORAGE_VERSION, ...session }),
    )
  },

  clear() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  },
}
