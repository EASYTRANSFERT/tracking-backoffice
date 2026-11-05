import { nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { driver, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

import { productTourSteps, type ProductTourStep } from '@/config/product-tour'
import { useAuthStore } from '@/stores/auth.store'
import { dashboardRouteByRole } from '@/types/roles'

/** Une seule visite à l'écran, même si plusieurs composants la demandent. */
let current: Driver | null = null

/** Élément affiché à l'écran : le menu latéral fermé (petit écran) reste dans la page, mais hors champ. */
function visibleTarget(target: string) {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
  const rect = element?.getBoundingClientRect()
  return rect?.width && rect.height && rect.right > 0 && rect.left < window.innerWidth ? element : null
}

/** Étapes dont l'élément est visible ; le bouton du menu ne sert que si le menu latéral est masqué. */
function driveSteps(steps: ProductTourStep[]): DriveStep[] {
  const navVisible = steps.some((step) => step.target?.startsWith('nav-') && visibleTarget(step.target))
  return steps.flatMap((step, index) => {
    // Rien avant la première étape : pas de bouton « Précédent » grisé.
    const popover: DriveStep['popover'] = { title: step.title, description: step.description, ...(index === 0 && { showButtons: ['next', 'close'] }) }
    if (!step.target) return [{ popover }]
    if (step.target === 'menu-toggle' && navVisible) return []
    const element = visibleTarget(step.target)
    return element ? [{ element, popover }] : []
  })
}

/**
 * Visite guidée de l'interface (driver.js), propre à chaque rôle, proposée à la première arrivée sur l'accueil.
 * Retenue par utilisateur et par rôle dans le navigateur : une autre machine la proposera de nouveau.
 */
export function useProductTour() {
  const router = useRouter()
  const route = useRoute()
  const { activeRole, currentUser } = storeToRefs(useAuthStore())

  const storageKey = () => `kaybic.product-tour.${currentUser.value?.id ?? 'anonyme'}.${activeRole.value}`
  // Stockage illisible (navigation privée) : on ne propose pas la visite à chaque page plutôt que de l'imposer.
  function hasSeen() {
    try { return localStorage.getItem(storageKey()) === 'seen' } catch { return true }
  }
  function markSeen() {
    try { localStorage.setItem(storageKey(), 'seen') } catch { /* visite non retenue, sans gravité */ }
  }

  const homeRoute = () => activeRole.value ? dashboardRouteByRole[activeRole.value] : null

  async function start() {
    if (!activeRole.value || current) return
    await nextTick()
    const steps = driveSteps(productTourSteps[activeRole.value])
    if (!steps.length) return
    current = driver({
      steps,
      showProgress: true,
      progressText: '{{current}} sur {{total}}',
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminer',
      popoverClass: 'kaybic-tour',
      // Un clic sur l'élément mis en avant (lien du menu) quitterait la page en pleine visite.
      disableActiveInteraction: true,
      // Fermer la visite (croix, Échap, clic à côté) vaut refus : elle ne revient pas toute seule.
      onDestroyed: () => {
        markSeen()
        current = null
      },
    })
    current.drive()
  }

  /** Première arrivée sur l'accueil du rôle : la visite démarre une fois la page affichée. */
  function startIfFirstVisit() {
    if (route.name !== homeRoute() || hasSeen()) return
    // Laisse le temps aux cartes de l'accueil de se placer, pour ne pas désigner un élément qui bouge encore.
    setTimeout(() => { if (route.name === homeRoute()) void start() }, 600)
  }

  /** « Revoir la visite » : depuis n'importe quelle page, on revient sur l'accueil où se trouvent les éléments présentés. */
  async function replay() {
    const home = homeRoute()
    if (home && route.name !== home) await router.push({ name: home })
    await start()
  }

  return { start, startIfFirstVisit, replay, hasSeen }
}
