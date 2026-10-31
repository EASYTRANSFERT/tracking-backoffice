import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { attachSitesErrorMessage, readSiteProblems } from '@/utils/mission-sites'

const conflict = (data: object) => new AxiosError('conflict', 'ERR_BAD_REQUEST', undefined, undefined, { status: 409, data } as never)

describe('attachSitesErrorMessage', () => {
  const names: Record<string, string> = { sit_1: 'Abatta BCEAO', sit_2: 'abobo site' }
  const nameOf = (siteId: string) => names[siteId] ?? 'Site inconnu'

  it('lists every refused site with its reason', () => {
    const error = conflict({ code: 'SITES_NOT_ASSIGNABLE', problems: [{ siteId: 'sit_1', reason: 'SITE_IN_OTHER_MISSION' }, { siteId: 'sit_2', reason: 'SITE_WITHOUT_TEAM' }] })

    expect(readSiteProblems(error)).toHaveLength(2)
    expect(attachSitesErrorMessage(error, nameOf)).toBe(
      'Aucun site n’a été attribué. Abatta BCEAO : déjà rattaché à une autre mission ; abobo site : la mission est ouverte et ce site n’a pas d’équipe.',
    )
  })

  it('explains a closed mission', () => {
    expect(attachSitesErrorMessage(conflict({ code: 'MISSION_STATUS_CONFLICT' }), nameOf)).toBe('Cette mission est clôturée : elle n’accueille plus de site.')
  })
})
