export type EnterpriseUserRole = 'administrator' | 'supervisor' | 'teamLeader' | 'agent'
export type EnterpriseUserStatus = 'active' | 'invited' | 'disabled'
export type SiteStatus = 'active' | 'inactive'
export type MissionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

export interface EnterpriseUser {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: EnterpriseUserRole
  team: string
  status: EnterpriseUserStatus
  createdAt: string
}

export type EnterpriseUserInput = Omit<EnterpriseUser, 'id' | 'status' | 'createdAt'>

export interface Site {
  id: string
  name: string
  address: string
  city: string
  latitude: string
  longitude: string
  radiusM: number
  managerId: string
  qrCode: string
  status: SiteStatus
  createdAt: string
}

export type SiteInput = Omit<Site, 'id' | 'qrCode' | 'status' | 'createdAt'>

export interface Mission {
  id: string
  title: string
  siteId: string
  startAt: string
  endAt: string
  supervisorId: string
  teamLeaderId: string
  teamName: string
  agentIds: string[]
  status: MissionStatus
  notes: string
}

export type MissionInput = Omit<Mission, 'id' | 'status'>

