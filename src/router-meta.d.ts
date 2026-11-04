import 'vue-router'
import type { UserRole } from '@/types/roles'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    allowedRoles?: UserRole[]
    directory?: 'users' | 'teams'
    /** La page a sa propre frise d'étapes : le parcours guidé s'y réduit à une ligne. */
    hasStepper?: boolean
  }
}

export {}
