import type { EnterpriseUser, Mission, Site } from '@/types/administrator'

export const mockEnterpriseUsers: EnterpriseUser[] = [
  { id: 'user-1', employeeNumber: 'EMP-001', firstName: 'Aïcha', lastName: 'Koné', email: 'aicha.kone@solibra.ci', phone: '+225 07 07 11 22 33', role: 'administrator', team: 'Administration', status: 'active', createdAt: '2026-09-02T09:00:00Z' },
  { id: 'user-2', employeeNumber: 'EMP-014', firstName: 'Yann', lastName: 'Kouassi', email: 'yann.kouassi@solibra.ci', phone: '+225 05 05 44 10 10', role: 'supervisor', team: 'Exploitation', status: 'active', createdAt: '2026-09-05T10:30:00Z' },
  { id: 'user-3', employeeNumber: 'EMP-021', firstName: 'Fatou', lastName: 'Bamba', email: 'fatou.bamba@solibra.ci', phone: '+225 01 02 40 50 60', role: 'teamLeader', team: 'Équipe Nord', status: 'active', createdAt: '2026-09-08T08:20:00Z' },
  { id: 'user-4', employeeNumber: 'EMP-033', firstName: 'Marc', lastName: 'Yao', email: 'marc.yao@solibra.ci', phone: '+225 07 55 12 08 90', role: 'agent', team: 'Équipe Nord', status: 'active', createdAt: '2026-09-12T11:10:00Z' },
  { id: 'user-5', employeeNumber: 'EMP-041', firstName: 'Aminata', lastName: 'Traoré', email: 'aminata.traore@solibra.ci', phone: '+225 05 66 70 80 90', role: 'agent', team: 'Équipe Sud', status: 'invited', createdAt: '2026-10-01T13:45:00Z' },
  { id: 'user-6', employeeNumber: 'EMP-048', firstName: 'Arnaud', lastName: 'N’Guessan', email: 'arnaud.nguessan@solibra.ci', phone: '+225 01 33 29 16 05', role: 'agent', team: 'Équipe Sud', status: 'disabled', createdAt: '2026-10-03T15:00:00Z' },
]

export const mockSites: Site[] = [
  { id: 'site-1', name: 'Entrepôt Vridi', address: 'Zone industrielle, boulevard de Vridi', city: 'Abidjan', latitude: '5.2678', longitude: '-4.0094', radiusM: 120, managerId: 'user-2', qrCode: 'KBA-SITE-VRIDI-001', status: 'active', createdAt: '2026-08-12T08:00:00Z' },
  { id: 'site-2', name: 'Dépôt Yopougon', address: 'Zone industrielle de Yopougon', city: 'Abidjan', latitude: '5.3452', longitude: '-4.0886', radiusM: 100, managerId: 'user-2', qrCode: 'KBA-SITE-YOP-002', status: 'active', createdAt: '2026-08-18T08:00:00Z' },
  { id: 'site-3', name: 'Agence Bouaké', address: 'Quartier Commerce, avenue Houphouët-Boigny', city: 'Bouaké', latitude: '7.6906', longitude: '-5.0300', radiusM: 80, managerId: 'user-3', qrCode: 'KBA-SITE-BKE-003', status: 'inactive', createdAt: '2026-09-01T08:00:00Z' },
]

export const mockMissions: Mission[] = [
  { id: 'mission-1', title: 'Inventaire mensuel Vridi', siteId: 'site-1', startAt: '2026-10-12T07:30', endAt: '2026-10-12T16:30', supervisorId: 'user-2', teamLeaderId: 'user-3', teamName: 'Équipe Nord', agentIds: ['user-4'], status: 'ongoing', notes: 'Contrôle des stocks et des mouvements.' },
  { id: 'mission-2', title: 'Contrôle dépôt Yopougon', siteId: 'site-2', startAt: '2026-10-14T08:00', endAt: '2026-10-14T17:00', supervisorId: 'user-2', teamLeaderId: 'user-3', teamName: 'Équipe Sud', agentIds: ['user-5', 'user-6'], status: 'scheduled', notes: 'Vérification des entrées et sorties.' },
  { id: 'mission-3', title: 'Audit agence Bouaké', siteId: 'site-3', startAt: '2026-10-02T08:00', endAt: '2026-10-03T16:00', supervisorId: 'user-2', teamLeaderId: 'user-3', teamName: 'Équipe Nord', agentIds: ['user-4'], status: 'completed', notes: 'Audit trimestriel.' },
  { id: 'mission-4', title: 'Maintenance balises', siteId: 'site-1', startAt: '2026-10-18T09:00', endAt: '2026-10-18T13:00', supervisorId: 'user-2', teamLeaderId: 'user-3', teamName: 'Équipe Nord', agentIds: ['user-4'], status: 'cancelled', notes: 'Reportée à la demande du site.' },
]

