import { describe, expect, it } from 'vitest'

import { demoRequestChanges, demoRequestFormValues, formatDemoRequestValue } from '@/Components/demo-requests/demo-request-format'
import type { DemoRequestResponse } from '@/types/demo-request'

const request: DemoRequestResponse = {
  id: 'dmr_1', fullName: 'Awa Koné', company: 'Sécurité Plus', email: 'awa@example.com', phone: '+225 01',
  status: 'NEW', notes: 'À rappeler', history: [], createdAt: '2026-11-01T08:00:00.000Z', updatedAt: '2026-11-01T08:00:00.000Z',
}

describe('demo request form', () => {
  it('sends nothing when the form is untouched', () => {
    expect(demoRequestChanges(request, demoRequestFormValues(request))).toEqual({})
  })

  it('sends only the changed fields, and null for a cleared optional field', () => {
    const values = { ...demoRequestFormValues(request), status: 'CONTACTED' as const, phone: '', notes: '  ', fullName: ' Awa Koné ' }
    expect(demoRequestChanges(request, values)).toEqual({ status: 'CONTACTED', phone: null, notes: null })
  })

  it('converts the demo date to ISO, or null when cleared', () => {
    const scheduled = demoRequestChanges(request, { ...demoRequestFormValues(request), demoAt: '2026-11-12T10:00' })
    expect(scheduled.demoAt).toBe(new Date('2026-11-12T10:00').toISOString())
    const withDate = { ...request, demoAt: scheduled.demoAt! }
    expect(demoRequestChanges(withDate, { ...demoRequestFormValues(withDate), demoAt: '' })).toEqual({ demoAt: null })
  })

  it('formats history values', () => {
    expect(formatDemoRequestValue('status', 'DEMO_SCHEDULED')).toBe('Démo planifiée')
    expect(formatDemoRequestValue('notes', null)).toBe('vide')
  })
})
