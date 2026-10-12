export type UserRole = 'operator' | 'administrator' | 'supervisor' | 'teamLeader'

export interface NavigationItem {
  title: string
  routeName: string
  icon?: string
  iconSrc?: string
  allowedRoles: UserRole[]
}
