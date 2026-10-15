export type AttendanceStatus = 'pending' | 'validated' | 'rejected' | 'missingExit'
export type AttendanceIssue = 'outOfZone' | 'outsideAssignment' | 'lowAccuracy' | 'suspect' | 'missingExit'

export interface AttendanceSession {
  id: string
  missionId: string
  teamId: string
  agentName: string
  siteName: string
  clockInAt: string
  clockOutAt?: string
  issue: AttendanceIssue
  status: AttendanceStatus
  agentComment?: string
  decisionReason?: string
}

export interface AttendanceDecision {
  decision: 'validate' | 'reject'
  reason?: string
  correctedClockOutAt?: string
}
