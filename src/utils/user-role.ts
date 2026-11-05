import { apiCodeMessage } from '@/utils/api-error'
import type { EnterpriseUserRole } from '@/types/administrator'

export const roleLabels: Record<EnterpriseUserRole, string> = { administrator: 'Administrateur', supervisor: 'Superviseur', teamLeader: 'Chef d’équipe', agent: 'Agent' }

/** Rôles attribuables depuis PUT /users/{id}/roles : l'administrateur n'en fait pas partie. */
export const assignableRoleOptions = (['supervisor', 'teamLeader', 'agent'] as const).map((value) => ({ title: roleLabels[value], value }))

const errorMessages: Record<string, string> = {
  STEP_UP_REQUIRED: 'Code TOTP refusé ou expiré : saisissez un code récent.',
  ROLE_NOT_ASSIGNABLE: 'Ce rôle ne peut pas être attribué depuis cette page.',
  LAST_ADMIN_REQUIRED: 'Impossible : l’entreprise doit garder au moins un administrateur.',
}

/** Message français d'un refus de changement de rôle, null s'il est inconnu (l'appelant retombe sur le message de l'API). */
export const userRoleErrorMessage = (error: unknown) => apiCodeMessage(error, errorMessages)
