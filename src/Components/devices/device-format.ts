import type { ApiDeviceStatus, DevicePlatform, DeviceResponse } from '@/types/device'

export const deviceStatusOptions: { title: string; value: ApiDeviceStatus }[] = [
  { title: 'Actif', value: 'ACTIVE' },
  { title: 'En cours d’activation', value: 'PENDING_ENROLLMENT' },
  { title: 'Révoqué', value: 'REVOKED' },
]

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  ACTIVE: { label: 'Actif', color: 'success', icon: 'mdi-check-circle' },
  PENDING_ENROLLMENT: { label: 'En activation', color: 'warning', icon: 'mdi-clock' },
  REVOKED: { label: 'Révoqué', color: 'secondary', icon: 'mdi-cellphone-off' },
}

/** Un statut inconnu de l'API reste affiché tel quel plutôt que masqué. */
export function deviceStatusConfig(status: ApiDeviceStatus) {
  return statusConfig[status] ?? { label: status, color: 'info', icon: 'mdi-help-circle-outline' }
}

export function platformLabel(platform: DevicePlatform) {
  return ({ android: 'Android', ios: 'iOS' } as Record<string, string>)[platform] ?? platform
}

export function deviceTitle(device: DeviceResponse) {
  return device.model || platformLabel(device.platform)
}

export function deviceSystem(device: DeviceResponse) {
  return [platformLabel(device.platform), device.osVersion].filter(Boolean).join(' ')
}

export function formatDeviceDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
}
