import type { RouteLocationRaw } from 'vue-router'

import type { AuditOutcome } from '@/types/audit'
import type { UserRole } from '@/types/roles'

export const auditOutcomeOptions: { title: string; value: AuditOutcome }[] = [
  { title: 'Réussie', value: 'SUCCESS' },
  { title: 'Échouée', value: 'FAILURE' },
]

const outcomeConfig: Record<string, { label: string; color: string; icon: string }> = {
  SUCCESS: { label: 'Réussie', color: 'success', icon: 'mdi-check-circle' },
  FAILURE: { label: 'Échouée', color: 'error', icon: 'mdi-alert-circle' },
}

export function auditOutcomeConfig(outcome: string) {
  return outcomeConfig[outcome] ?? { label: outcome, color: 'info', icon: 'mdi-help-circle-outline' }
}

/** Libellés des actions connues ; les autres codes restent affichés tels quels. */
const actionLabels: Record<string, string> = {
  DEVICE_REVOKED: 'Appareil révoqué',
  SELFIE_VIEWED: 'Selfie consulté',
}

export const knownAuditActions = Object.keys(actionLabels)

export const auditActionLabel = (action: string) => actionLabels[action] ?? action

const targetTypeLabels: Record<string, string> = {
  user: 'Utilisateur',
  device: 'Appareil',
  site: 'Site',
  mission: 'Mission',
  team: 'Équipe',
  tenant: 'Entreprise',
  offer: 'Offre',
  session: 'Pointage',
  check: 'Contrôle',
  assignment: 'Affectation',
}

/** « type:identifiant » découpé ; une cible sans type est rendue entière comme identifiant. */
export function parseAuditTarget(target: string) {
  const index = target.indexOf(':')
  if (index < 0) return { type: '', typeLabel: 'Ressource', id: target }
  const type = target.slice(0, index)
  return { type, typeLabel: targetTypeLabels[type] ?? type, id: target.slice(index + 1) }
}

/** Page de détail de la ressource visée, quand le profil connecté en dispose. */
export function auditTargetRoute(target: string, role: UserRole | null): RouteLocationRaw | null {
  const { type, id } = parseAuditTarget(target)
  if (role === 'administrator') {
    switch (type) {
      case 'user': return { name: 'admin-user-details', params: { userId: id } }
      case 'device': return { name: 'admin-device-details', params: { deviceId: id } }
      case 'site': return { name: 'admin-site-details', params: { siteId: id } }
      case 'mission': return { name: 'admin-mission-details', params: { missionId: id } }
    }
  }
  if (role === 'operator') {
    switch (type) {
      case 'tenant': return { name: 'company-details', params: { companyId: id } }
      case 'offer': return { name: 'offer-details', params: { offerId: id } }
    }
  }
  return null
}

export function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}

/** Champ de saisie « AAAA-MM-JJ » vers une borne ISO incluse, en heure locale. */
export function dayBoundToIso(day: string, bound: 'start' | 'end') {
  return new Date(`${day}T${bound === 'start' ? '00:00:00.000' : '23:59:59.999'}`).toISOString()
}

export function formatAuditValue(value: unknown) {
  if (value === undefined) return '—'
  if (value === null) return 'null'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}
