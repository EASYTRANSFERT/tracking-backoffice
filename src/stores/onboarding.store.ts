import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import { onboardingSteps } from '@/config/onboarding'
import { useAuthStore } from '@/stores/auth.store'

/** Parcours en cours, étape affichée et étapes franchies (indices dans la liste du rôle). */
interface Tour { active: boolean; current: number; done: number[] }

const idle: Tour = { active: false, current: 0, done: [] }

/**
 * Parcours guidé « Commencer ici » : état d'interface uniquement, sans appel à l'API.
 * Une étape n'est cochée que franchie pendant le parcours (« Suivant »), jamais parce que des données existent déjà.
 * Retenu par utilisateur dans le navigateur, pour survivre à un rechargement de la page.
 */
export const useOnboardingStore = defineStore('onboarding', () => {
  const { activeRole, currentUser } = storeToRefs(useAuthStore())
  const steps = computed(() => activeRole.value === 'administrator' || activeRole.value === 'supervisor' ? onboardingSteps[activeRole.value] : [])

  const storageKey = computed(() => `kaybic.onboarding.${currentUser.value?.id ?? 'anonyme'}.${activeRole.value}`)
  const tour = ref<Tour>(idle)
  // Stockage local illisible (navigation privée) : le parcours repart simplement de zéro.
  watch(storageKey, (key) => {
    try { tour.value = { ...idle, ...JSON.parse(localStorage.getItem(key) ?? '{}') } }
    catch { tour.value = idle }
  }, { immediate: true })
  function save(next: Partial<Tour>) {
    tour.value = { ...tour.value, ...next }
    try { localStorage.setItem(storageKey.value, JSON.stringify(tour.value)) } catch { /* parcours non retenu, sans gravité */ }
  }

  const isActive = computed(() => tour.value.active && steps.value.length > 0)
  const current = computed(() => Math.min(tour.value.current, steps.value.length - 1))
  const done = computed(() => tour.value.done)

  /** Nouveau parcours : première étape, rien de coché. */
  const start = () => save({ active: true, current: 0, done: [] })
  /** Se rend sur une étape sans la cocher (clic sur la frise, page ouverte depuis le menu). */
  const goTo = (index: number) => save({ current: index })
  /** « Suivant » : l'étape affichée est franchie ; la suivante devient l'étape en cours, ou le parcours s'achève. */
  function next() {
    const passed = [...new Set([...tour.value.done, current.value])]
    save(current.value < steps.value.length - 1 ? { current: current.value + 1, done: passed } : { active: false, done: passed })
  }
  const stop = () => save({ active: false })

  return { steps, isActive, current, done, start, goTo, next, stop }
})
