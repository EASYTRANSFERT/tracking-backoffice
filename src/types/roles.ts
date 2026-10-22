import type { ApiUserRole } from '@/types/user'

/** Profils admis dans le back-office. Les chefs d'équipe et les agents n'utilisent que l'application mobile. */
export type UserRole = 'operator' | 'administrator' | 'supervisor'

export interface NavigationItem {
  title: string
  routeName: string
  icon?: string
  iconSrc?: string
  allowedRoles: UserRole[]
  prototypeOnly?: boolean
}

const dashboardRoleByApiRole: Partial<Record<ApiUserRole, UserRole>> = {
  OPERATOR: 'operator',
  ADMIN: 'administrator',
  SUPERVISOR: 'supervisor',
}

export const dashboardRouteByRole: Record<UserRole, string> = {
  operator: 'dashboard',
  administrator: 'admin-dashboard',
  supervisor: 'supervisor-dashboard',
}

export const roleLabelByRole: Record<UserRole, string> = {
  operator: 'Opérateur KAYBIC',
  administrator: 'Administrateur entreprise',
  supervisor: 'Superviseur',
}

export function getDashboardRoles(roles: ApiUserRole[]): UserRole[] {
  return roles.flatMap((role) => {
    const dashboardRole = dashboardRoleByApiRole[role]
    return dashboardRole ? [dashboardRole] : []
  })
}
