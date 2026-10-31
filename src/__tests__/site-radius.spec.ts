import { describe, expect, it } from 'vitest'

import { toleranceRadiusRule } from '@/utils/site-radius'

describe('toleranceRadiusRule', () => {
  it('accepts a whole number of at least 100 m', () => {
    expect(toleranceRadiusRule(100)).toBe(true)
    expect(toleranceRadiusRule('250')).toBe(true)
  })

  it('refuses less than 100 m, decimals and empty values', () => {
    expect(toleranceRadiusRule(99)).toBe('Le rayon doit être d’au moins 100 m')
    expect(toleranceRadiusRule(120.5)).not.toBe(true)
    expect(toleranceRadiusRule('')).not.toBe(true)
  })
})
