import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { onboardingSteps } from '@/config/onboarding'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

function startAs(role: 'administrator' | 'supervisor') {
  useAuthStore().activeRole = role
  const store = useOnboardingStore()
  store.start()
  return store
}

describe('parcours guidé', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('suit l’ordre imposé par l’API, comptes d’abord, périodes avant les sites et le planning', () => {
    expect(onboardingSteps.administrator.map((step) => step.title)).toEqual(['Comptes', 'Équipes', 'Missions', 'Périodes', 'Sites', 'Planning', 'Téléphones'])
    expect(onboardingSteps.supervisor.map((step) => step.title)).toEqual(['Missions', 'Périodes', 'Contrôles'])
  })

  it('démarre à la première étape, sans rien de coché', () => {
    const store = startAs('administrator')
    expect(store.isActive).toBe(true)
    expect(store.current).toBe(0)
    expect(store.done).toEqual([])
  })

  it('ne coche que les étapes franchies avec « Suivant », pas celles atteintes par un clic', () => {
    const store = startAs('administrator')
    store.next()
    store.goTo(4)
    expect(store.current).toBe(4)
    expect(store.done).toEqual([0])
  })

  it('s’achève après la dernière étape et repart de zéro au démarrage suivant', () => {
    const store = startAs('supervisor')
    store.next(); store.next(); store.next()
    expect(store.isActive).toBe(false)
    expect(store.done).toEqual([0, 1, 2])
    store.start()
    expect(store.done).toEqual([])
  })

  it('survit à un rechargement de la page', () => {
    startAs('administrator').next()
    setActivePinia(createPinia())
    useAuthStore().activeRole = 'administrator'
    const reloaded = useOnboardingStore()
    expect(reloaded.isActive).toBe(true)
    expect(reloaded.current).toBe(1)
  })
})
