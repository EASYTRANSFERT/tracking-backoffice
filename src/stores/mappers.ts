/*
 * Conversions entre le format de l'API et celui des écrans, partagées par les stores.
 */
import type { EnterpriseUser, Mission, Site, SitePoint, Team } from '@/types/administrator'
import type { MissionResponse } from '@/types/mission'
import type { SiteCoordinate, SiteResponse } from '@/types/site'
import type { TeamResponse } from '@/types/team'
import type { ApiUserRole, UserResponse } from '@/types/user'

export function toArea(points: SitePoint[]): SiteCoordinate[] {
  return points.map(({ latitude, longitude }) => ({ latitude, longitude }))
}

// Ville, adresses des points et image du QR n'existent pas côté API : on conserve la copie locale existante.
export function mapSite(site: SiteResponse, previous?: Site): Site {
  // Un point incomplet renvoyé par l'API est ignoré plutôt que de bloquer toute la liste.
  const validArea = (site.area ?? []).filter((point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude))
  const points: SitePoint[] = validArea.map((point, index) => {
    const known = previous?.points?.[index]
    const address = known?.latitude === point.latitude && known.longitude === point.longitude ? known.address : undefined
    return { latitude: point.latitude, longitude: point.longitude, address }
  })
  // Le premier point du contour sert de repère sur la carte des sites.
  const [anchor] = points
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    locationDescription: site.locationDescription,
    city: previous?.city,
    latitude: anchor?.latitude.toFixed(6),
    longitude: anchor?.longitude.toFixed(6),
    radiusM: site.radiusM,
    points,
    missionId: site.missionId ?? undefined,
    teamId: site.teamId,
    managerId: site.managerId,
    qrCode: '',
    qrImage: previous?.qrImage,
    qrRotatedAt: site.qrRotatedAt,
    status: site.status === 'ACTIVE' ? 'active' : 'inactive',
    createdAt: site.createdAt,
  }
}
export const roleToApi: Record<EnterpriseUser['role'], ApiUserRole> = {
  administrator: 'ADMIN', supervisor: 'SUPERVISOR', teamLeader: 'TEAM_LEAD', agent: 'AGENT',
}
const roleFromApi: Partial<Record<ApiUserRole, EnterpriseUser['role']>> = {
  ADMIN: 'administrator', SUPERVISOR: 'supervisor', TEAM_LEAD: 'teamLeader', AGENT: 'agent',
}

export function mapUser(user: UserResponse): EnterpriseUser {
  const [firstName = '', ...lastNameParts] = user.names.trim().split(/\s+/)
  const apiRole = user.roles.find((role) => roleFromApi[role])
  return {
    id: user.id,
    employeeNumber: user.matricule,
    firstName,
    lastName: lastNameParts.join(' '),
    email: user.email ?? '',
    phone: user.phone,
    role: apiRole ? roleFromApi[apiRole]! : 'agent',
    teamId: user.teamId,
    status: user.status === 'ACTIVE' ? 'active' : user.status === 'DISABLED' ? 'disabled' : 'invited',
    createdAt: user.createdAt,
  }
}

export function mapTeam(team: TeamResponse): Team {
  return {
    id: team.id,
    name: team.name,
    leadUserId: team.leadUserId ?? undefined,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }
}

const missionStatusFromApi: Record<MissionResponse['status'], Mission['status']> = {
  PLANNED: 'scheduled',
  OPEN: 'ongoing',
  CLOSED: 'completed',
}

export function mapMission(mission: MissionResponse): Mission {
  return {
    id: mission.id,
    code: mission.code,
    title: mission.name,
    notes: mission.description ?? '',
    startAt: mission.startAt,
    endAt: mission.endAt,
    status: missionStatusFromApi[mission.status],
    supervisorUserId: mission.supervisorUserId ?? undefined,
    openedAt: mission.openedAt,
    closedAt: mission.closedAt,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  }
}
