export type EnterpriseUserRole = 'administrator' | 'supervisor' | 'teamLeader' | 'agent'
export type EnterpriseUserStatus = 'active' | 'invited' | 'disabled'
export type SiteStatus = 'draft' | 'active' | 'inactive'
export type MissionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

export interface EnterpriseUser {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: EnterpriseUserRole
  teamId?: string
  status: EnterpriseUserStatus
  createdAt: string
}

export type EnterpriseUserInput = Omit<EnterpriseUser, 'id' | 'status' | 'createdAt'> & {
  password?: string
}

export interface Team {
  id: string
  name: string
  leadUserId?: string
  createdAt: string
  updatedAt: string
}

export type TeamInput = Pick<Team, 'name'>

export interface Site {
  id: string
  name: string
  address?: string
  city?: string
  latitude?: string
  longitude?: string
  radiusM?: number
  managerId?: string
  qrCode: string
  status: SiteStatus
  createdAt: string
}

export type SiteInput = Omit<Site, 'id' | 'qrCode' | 'status' | 'createdAt'>

export interface Mission {
  id: string
  code: string
  title: string
  siteId?: string
  startAt?: string
  endAt?: string
  supervisorId?: string
  teamId?: string
  status: MissionStatus
  notes: string
  openedAt?: string
  closedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type MissionInput = Pick<Mission, 'code' | 'title' | 'startAt' | 'endAt' | 'notes'>
