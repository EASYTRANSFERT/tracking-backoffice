import type { RouteLocationRaw } from 'vue-router'

export type OnboardingRole = 'administrator' | 'supervisor'

/** Une étape du parcours guidé : son nom dans la frise et la page où elle se fait. */
export interface OnboardingStep {
  title: string
  to: RouteLocationRaw
}

/**
 * Ordre imposé par l'API : une mission ou un site exige un superviseur, une équipe ses agents,
 * une période son équipe, et aucun créneau n'est accepté hors d'une période de l'équipe.
 */
export const onboardingSteps: Record<OnboardingRole, OnboardingStep[]> = {
  administrator: [
    { title: 'Comptes', to: { name: 'admin-user-create' } },
    { title: 'Équipes', to: { name: 'admin-team-create' } },
    { title: 'Missions', to: { name: 'admin-mission-create' } },
    { title: 'Périodes', to: { name: 'admin-periods', query: { create: '1' } } },
    { title: 'Sites', to: { name: 'admin-site-create' } },
    // Les créneaux se planifient depuis la fiche d'un site.
    { title: 'Planning', to: { name: 'admin-sites' } },
    { title: 'Téléphones', to: { name: 'admin-devices' } },
  ],
  supervisor: [
    { title: 'Missions', to: { name: 'supervisor-missions' } },
    { title: 'Périodes', to: { name: 'supervisor-periods', query: { create: '1' } } },
    { title: 'Contrôles', to: { name: 'supervisor-checks', query: { create: '1' } } },
  ],
}
