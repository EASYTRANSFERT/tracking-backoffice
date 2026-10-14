import type { ApiUserRole } from '@/types/user'

export type UserRole = 'operator' | 'administrator' | 'supervisor' | 'teamLeader'

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
  TEAM_LEAD: 'teamLeader',
}

export const dashboardRouteByRole: Record<UserRole, string> = {
  operator: 'dashboard',
  administrator: 'admin-dashboard',
  supervisor: 'supervisor-dashboard',
  teamLeader: 'team-leader-dashboard',
}

export const roleLabelByRole: Record<UserRole, string> = {
  operator: 'Opérateur KAYBIC',
  administrator: 'Administrateur entreprise',
  supervisor: 'Superviseur',
  teamLeader: "Chef d'équipe",
}

export function getDashboardRoles(roles: ApiUserRole[]): UserRole[] {
  return roles.flatMap((role) => {
    const dashboardRole = dashboardRoleByApiRole[role]
    return dashboardRole ? [dashboardRole] : []
  })
}
