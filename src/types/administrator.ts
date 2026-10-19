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
  supervisorUserId: string
  createdAt: string
  updatedAt: string
}

export type TeamInput = Pick<Team, 'name' | 'supervisorUserId'>

export interface SitePoint {
  latitude: number
  longitude: number
  address?: string
}

export interface Site {
  id: string
  name: string
  address?: string
  city?: string
  latitude?: string
  longitude?: string
  radiusM?: number
  points?: SitePoint[]
  locationDescription?: string
  missionId?: string
  teamId?: string
  managerId?: string
  qrCode: string
  /** Image PNG (URI de données) renvoyée à la génération : l'API ne permet pas de la relire. */
  qrImage?: string
  qrRotatedAt?: string
  status: SiteStatus
  createdAt: string
}

export type SiteInput = Omit<Site, 'id' | 'qrCode' | 'qrImage' | 'qrRotatedAt' | 'status' | 'createdAt'>

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
