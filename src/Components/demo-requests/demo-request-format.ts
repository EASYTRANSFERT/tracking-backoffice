import { formatAuditValue } from '@/Components/audit/audit-format'
import { toLocalInput } from '@/utils/adjustment-format'
import type { DemoRequestResponse, DemoRequestStatus, UpdateDemoRequestRequest } from '@/types/demo-request'

const statusConfig: Record<DemoRequestStatus, { label: string; color: string; icon: string }> = {
  NEW: { label: 'Nouvelle', color: 'info', icon: 'mdi-email-alert-outline' },
  CONTACTED: { label: 'Contacté', color: 'warning', icon: 'mdi-phone-check-outline' },
  DEMO_SCHEDULED: { label: 'Démo planifiée', color: 'primary', icon: 'mdi-calendar-clock' },
  CONVERTED: { label: 'Converti', color: 'success', icon: 'mdi-check-circle' },
  CLOSED: { label: 'Clôturée', color: 'secondary', icon: 'mdi-close-circle-outline' },
}

export const demoRequestStatusConfig = (status: string) =>
  statusConfig[status as DemoRequestStatus] ?? { label: status, color: 'info', icon: 'mdi-help-circle-outline' }

export const demoRequestStatusOptions = (Object.keys(statusConfig) as DemoRequestStatus[])
  .map((value) => ({ title: statusConfig[value].label, value }))

const fieldLabels: Record<string, string> = {
  fullName: 'Nom',
  company: 'Entreprise',
  email: 'Courriel',
  phone: 'Téléphone',
  message: 'Message',
  status: 'Statut',
  demoAt: 'Date de la démo',
  notes: 'Notes internes',
}

export const demoRequestFieldLabel = (field: string) => fieldLabels[field] ?? field

/** Valeur d'une entrée d'historique, lisible : statut traduit, date formatée, « vide » pour un champ effacé. */
export function formatDemoRequestValue(field: string, value: unknown) {
  if (value === null || value === undefined || value === '') return 'vide'
  if (field === 'status') return demoRequestStatusConfig(String(value)).label
  if (field === 'demoAt') return formatDemoDate(String(value))
  return formatAuditValue(value)
}

export function formatDemoDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export interface DemoRequestFormValues {
  fullName: string
  company: string
  email: string
  phone: string
  message: string
  status: DemoRequestStatus
  /** Valeur d'un champ datetime-local. */
  demoAt: string
  notes: string
}

export function demoRequestFormValues(request: DemoRequestResponse): DemoRequestFormValues {
  return {
    fullName: request.fullName,
    company: request.company,
    email: request.email,
    phone: request.phone ?? '',
    message: request.message ?? '',
    status: request.status,
    demoAt: toLocalInput(request.demoAt),
    notes: request.notes ?? '',
  }
}

/** Ne retient que ce qui change ; un champ facultatif vidé est envoyé à `null` pour être effacé. */
export function demoRequestChanges(request: DemoRequestResponse, values: DemoRequestFormValues): UpdateDemoRequestRequest {
  const current = demoRequestFormValues(request)
  const payload: UpdateDemoRequestRequest = {}
  for (const key of ['fullName', 'company', 'email'] as const) {
    const value = values[key].trim()
    if (value !== current[key]) payload[key] = value
  }
  if (values.status !== current.status) payload.status = values.status
  for (const key of ['phone', 'message', 'notes'] as const) {
    const value = values[key].trim()
    if (value !== current[key]) payload[key] = value || null
  }
  if (values.demoAt !== current.demoAt) payload.demoAt = values.demoAt ? new Date(values.demoAt).toISOString() : null
  return payload
}
