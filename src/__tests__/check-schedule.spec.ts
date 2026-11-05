import { describe, expect, it } from 'vitest'

import { defaultScheduleName, describePeriod, describeSchedule, formatInterval, scheduleDefaults } from '@/utils/check-schedule'

describe('programmes de contrôles', () => {
  it('formate une fréquence en heures et minutes', () => {
    expect(formatInterval(30)).toBe('30 min')
    expect(formatInterval(60)).toBe('1 h')
    expect(formatInterval(90)).toBe('1 h 30')
  })

  it('résume chaque mode en une ligne', () => {
    expect(describeSchedule({ mode: 'ONCE', date: '2026-11-20', time: '10:30' })).toBe('20/11 · 10:30')
    expect(describeSchedule({ mode: 'DAILY', time: '10:30' })).toBe('Chaque jour · 10:30')
    expect(describeSchedule({ mode: 'INTERVAL', everyMin: 90 })).toBe('Toutes les 1 h 30')
  })

  it('décrit la période d’un programme récurrent, rien pour un contrôle ponctuel', () => {
    expect(describePeriod({ mode: 'DAILY', startDate: '2026-11-03', endDate: '2026-12-31' })).toBe('Du 03/11 au 31/12')
    expect(describePeriod({ mode: 'INTERVAL', startDate: '2026-11-03' })).toBe('Dès le 03/11')
    expect(describePeriod({ mode: 'ONCE', startDate: '2026-11-03' })).toBe('')
  })

  it('propose un nom quand aucun n’est saisi', () => {
    expect(defaultScheduleName({ mode: 'ONCE', date: '2026-11-20', time: '10:30' })).toBe('Contrôle du 20/11 à 10:30')
    expect(defaultScheduleName({ mode: 'DAILY', time: '08:00' })).toBe('Contrôle quotidien à 08:00')
    expect(defaultScheduleName({ mode: 'INTERVAL', everyMin: 120 })).toBe('Contrôle toutes les 2 h')
  })

  it('pré-remplit dans une heure, arrondi à la demi-heure suivante', () => {
    expect(scheduleDefaults(new Date(2026, 10, 3, 9, 10))).toMatchObject({ date: '2026-11-03', time: '10:30', everyMin: 90, startDate: '2026-11-03' })
    expect(scheduleDefaults(new Date(2026, 10, 3, 23, 40))).toMatchObject({ date: '2026-11-04', time: '01:00' })
  })
})
