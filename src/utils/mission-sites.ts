import { isAxiosError } from 'axios'

import { getApiErrorMessage } from '@/utils/api-error'
import { apiErrorCode } from '@/utils/api-error'

/** Un site refusé par POST /missions/{id}/sites, avec sa raison. */
export interface MissionSiteProblem {
  siteId: string
  reason: string
}

const reasonLabels: Record<string, string> = {
  SITE_NOT_FOUND: 'site introuvable',
  SITE_ARCHIVED: 'site archivé',
  SITE_IN_OTHER_MISSION: 'déjà rattaché à une autre mission',
  SITE_WITHOUT_TEAM: 'la mission est ouverte et ce site n’a pas d’équipe',
}

/** Sites refusés d'une erreur SITES_NOT_ASSIGNABLE (`problems`, à la racine du problème ou sous `extensions`). */
export function readSiteProblems(error: unknown): MissionSiteProblem[] {
  if (!isAxiosError(error)) return []
  const body = error.response?.data as { problems?: unknown; extensions?: { problems?: unknown } } | undefined
  const list = body?.problems ?? body?.extensions?.problems
  if (!Array.isArray(list)) return []
  return list.flatMap((item: Record<string, unknown>) => {
    const siteId = item?.siteId ?? item?.id
    const reason = item?.reason ?? item?.code
    return typeof siteId === 'string' && typeof reason === 'string' ? [{ siteId, reason }] : []
  })
}

/** Message d'un refus d'attribution : chaque site refusé avec sa raison (tout ou rien, donc aucun n'a été attribué). */
export function attachSitesErrorMessage(error: unknown, siteName: (siteId: string) => string) {
  const code = apiErrorCode(error)
  if (code === 'MISSION_STATUS_CONFLICT') return 'Cette mission est clôturée : elle n’accueille plus de site.'
  const problems = readSiteProblems(error)
  if (code === 'SITES_NOT_ASSIGNABLE' && problems.length) {
    return `Aucun site n’a été attribué. ${problems.map(({ siteId, reason }) => `${siteName(siteId)} : ${reasonLabels[reason] ?? reason}`).join(' ; ')}.`
  }
  return getApiErrorMessage(error, 'Impossible d’attribuer ces sites à la mission.')
}
