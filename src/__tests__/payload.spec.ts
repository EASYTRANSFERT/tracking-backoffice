import { describe, expect, it } from 'vitest'

import { changedFields } from '@/utils/payload'

describe('changedFields', () => {
  it('keeps only the fields that differ from the current values', () => {
    const current = { names: 'Awa Koffi', phone: '+2250700000000', teamId: 'tea_1' }

    expect(changedFields(current, { names: 'Awa Koffi', phone: '+2250700000001', teamId: 'tea_1' })).toEqual({ phone: '+2250700000001' })
  })

  it('ignores undefined values and returns nothing when nothing changed', () => {
    const current = { names: 'Awa Koffi', email: 'awa@exemple.com' }

    expect(changedFields(current, { names: 'Awa Koffi', email: undefined, password: undefined } as Partial<typeof current>)).toEqual({})
  })
})
