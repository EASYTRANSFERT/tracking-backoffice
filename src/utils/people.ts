import type { EnterpriseUser } from '@/types/administrator'

type Named = Pick<EnterpriseUser, 'firstName' | 'lastName'>

/**
 * « Prénom Nom », tel qu'affiché partout dans le back-office. Tolère une valeur sans nom
 * (un v-select peut passer l'identifiant brut d'un élément absent de sa liste).
 */
export const fullName = (user: Named) => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()

/** « Prénom Nom », ou un libellé de remplacement quand personne n'est désigné. */
export const nameOr = (user: Named | null | undefined, fallback = 'Non affecté') => user ? fullName(user) : fallback

/** Tri alphabétique par nom puis prénom, à la française. */
export const byName = (a: Named, b: Named) =>
  `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')

/** Membre d'une équipe : un agent ou son chef d'équipe. */
export const isTeamMember = (user: Pick<EnterpriseUser, 'role'>) => user.role === 'agent' || user.role === 'teamLeader'
