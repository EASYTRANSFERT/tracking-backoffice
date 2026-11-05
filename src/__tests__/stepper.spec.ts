import { describe, expect, it } from 'vitest'

import { useStepper } from '@/composables/useStepper'

describe('useStepper', () => {
  it('n’avance que si l’étape affichée est valide', async () => {
    const valid = [false, true, true]
    const stepper = useStepper(3, { validate: (index) => valid[index]! })

    expect(await stepper.next()).toBe(false)
    expect(stepper.current.value).toBe(0)
    expect(stepper.invalid.value).toEqual([0])

    valid[0] = true
    expect(await stepper.next()).toBe(true)
    expect(stepper.current.value).toBe(1)
    expect(stepper.completed.value).toEqual([0])
    expect(stepper.invalid.value).toEqual([])
  })

  it('ne laisse pas sauter une étape non encore atteinte, sauf en navigation libre', async () => {
    const linear = useStepper(3)
    expect(linear.canReach(2)).toBe(false)
    await linear.goTo(2)
    expect(linear.current.value).toBe(0)

    const free = useStepper(3, { freeNavigation: true })
    await free.goTo(2)
    expect(free.current.value).toBe(2)
  })

  it('revient librement en arrière', async () => {
    const stepper = useStepper(3, { validate: () => true })
    await stepper.next()
    await stepper.next()
    stepper.previous()
    expect(stepper.current.value).toBe(1)
    expect(stepper.canReach(2)).toBe(true)
  })

  it('validateAll affiche la première étape en erreur', async () => {
    const stepper = useStepper(4, { freeNavigation: true, initial: 3, validate: (index) => index !== 1 })
    expect(await stepper.validateAll()).toBe(false)
    expect(stepper.current.value).toBe(1)
    expect(await stepper.validateAll(1)).toBe(true)
  })
})
