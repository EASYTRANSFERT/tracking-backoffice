import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

/** Une étape d'un parcours : titre et sous-titre dans la frise, description en tête de l'étape affichée. */
export interface StepItem {
  title: string
  subtitle?: string
  description?: string
  icon?: string
}

interface StepperOptions {
  /** Valide l'étape d'index donné : une étape refusée bloque l'avancée. */
  validate?: (index: number) => boolean | Promise<boolean>
  /** Vrai : toutes les étapes sont accessibles d'emblée (modification d'un élément existant). */
  freeNavigation?: MaybeRefOrGetter<boolean>
  initial?: number
}

/** Validation d'un v-form d'étape ; une étape sans formulaire est valide. */
export const isFormValid = async (form?: { validate: () => Promise<{ valid: boolean }> }) => (await form?.validate())?.valid ?? true

/** Parcours en étapes : on n'avance qu'une fois l'étape affichée valide, on revient librement en arrière. */
export function useStepper(count: MaybeRefOrGetter<number>, options: StepperOptions = {}) {
  const current = ref(options.initial ?? 0)
  const furthest = ref(current.value)
  // Ouvrir le parcours sur une étape avancée suppose les précédentes déjà remplies.
  const completed = ref(Array.from({ length: current.value }, (_, index) => index))
  const invalid = ref<number[]>([])
  const last = computed(() => toValue(count) - 1)
  const isFirst = computed(() => current.value === 0)
  const isLast = computed(() => current.value === last.value)

  const canReach = (index: number) => index >= 0 && index <= last.value && (toValue(options.freeNavigation) || index <= furthest.value)

  async function check(index: number) {
    const valid = await (options.validate?.(index) ?? true)
    completed.value = valid ? [...new Set([...completed.value, index])] : completed.value.filter((item) => item !== index)
    invalid.value = valid ? invalid.value.filter((item) => item !== index) : [...new Set([...invalid.value, index])]
    return valid
  }

  function show(index: number) {
    current.value = index
    furthest.value = Math.max(furthest.value, index)
  }

  async function next() {
    if (!(await check(current.value))) return false
    if (!isLast.value) show(current.value + 1)
    return true
  }

  function previous() {
    if (!isFirst.value) current.value -= 1
  }

  // Avancer valide d'abord l'étape affichée ; revenir en arrière est toujours possible.
  async function goTo(index: number) {
    if (!canReach(index) || index === current.value) return
    if (index > current.value && !(await check(current.value))) return
    show(index)
  }

  /** Valide les étapes avant `until` (toutes par défaut) et affiche la première en erreur. */
  async function validateAll(until = last.value + 1) {
    for (let index = 0; index < until; index++) {
      if (!(await check(index))) {
        show(index)
        return false
      }
    }
    return true
  }

  return { current, completed, invalid, isFirst, isLast, canReach, next, previous, goTo, validateAll }
}
