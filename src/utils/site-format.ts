import type { Site } from '@/types/administrator'

/** Adresse d'un site sur une ligne (« rue, ville »), ou un rappel quand elle manque. */
export const siteAddress = (site: Pick<Site, 'address' | 'city'>) => [site.address, site.city].filter(Boolean).join(', ') || 'Adresse à compléter'
