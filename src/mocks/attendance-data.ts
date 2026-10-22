import type { AttendanceSession } from '@/types/attendance'

export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },
  {
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },{
    id: 'session-1', missionId: 'mission-1', teamId: 'team-1', agentName: 'Marc Yao',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-15T07:42:00Z', clockOutAt: '2026-10-15T16:18:00Z',
    issue: 'outOfZone', status: 'pending', agentComment: 'Le signal GPS était instable près du portail.',
  },
  {
    id: 'session-2', missionId: 'mission-2', teamId: 'team-2', agentName: 'Aminata Traoré',
    siteName: 'Dépôt Yopougon', clockInAt: '2026-10-15T08:09:00Z',
    issue: 'missingExit', status: 'missingExit', agentComment: 'Sortie non enregistrée.',
  },
  {
    id: 'session-3', missionId: 'mission-1', teamId: 'team-1', agentName: 'Fatou Bamba',
    siteName: 'Entrepôt Vridi', clockInAt: '2026-10-14T07:28:00Z', clockOutAt: '2026-10-14T16:33:00Z',
    issue: 'lowAccuracy', status: 'validated', decisionReason: 'Présence confirmée par le responsable du site.',
  },
]
