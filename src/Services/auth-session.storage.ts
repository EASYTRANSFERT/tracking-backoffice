import type { SessionResponse } from '@/types/auth'

const SESSION_STORAGE_KEY = 'kaybic.backoffice.session'
const SESSION_STORAGE_VERSION = 1
const REFRESH_LOCK_NAME = 'kaybic.backoffice.refresh'

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

/*
 * localStorage : la session survit à la fermeture du navigateur et est
 * partagée entre les onglets, pour que le jeton de renouvellement (30 jours)
 * serve vraiment.
 */
export const authSessionStorage = {
  read(): PersistedAuthSession | null {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)

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
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: SESSION_STORAGE_VERSION, ...session }),
    )
  },

  clear() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  },

  /** Appelle `listener` quand un AUTRE onglet écrit, renouvelle ou efface la session. Renvoie la fonction d'arrêt. */
  subscribe(listener: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SESSION_STORAGE_KEY) listener()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },

  /**
   * Un seul renouvellement à la fois, tous onglets confondus. Le jeton de
   * renouvellement est à usage unique (rotation + détection de rejeu) :
   * deux onglets qui l'envoient en même temps feraient révoquer la session.
   */
  withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
    if (typeof navigator === 'undefined' || !navigator.locks) return task()
    return navigator.locks.request(REFRESH_LOCK_NAME, task)
  },
}
