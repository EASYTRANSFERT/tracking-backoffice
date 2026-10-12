import 'vue-router'
import type { UserRole } from '@/types/roles'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    allowedRoles?: UserRole[]
  }
}

export {}
