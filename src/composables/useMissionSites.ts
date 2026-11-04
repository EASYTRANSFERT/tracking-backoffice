import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { getApiErrorMessage } from '@/utils/api-error'
import { attachSitesErrorMessage } from '@/utils/mission-sites'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

/** Sites d'une mission : chargement et attribution de sites existants (fiche et formulaire de mission). */
export function useMissionSites(missionId: MaybeRefOrGetter<string | undefined>) {
  const store = useAdministratorStore()
  const feedback = useUiFeedbackStore()

  // Côté API, c'est le site qui porte sa mission (site.missionId) : une mission peut avoir plusieurs sites.
  const missionSites = computed(() => {
    const id = toValue(missionId)
    return id ? store.getMissionSites(id) : []
  })
  const availableSites = computed(() => store.sitesWithoutMission)
  const isSitesLoading = ref(false)
  const attachDialog = ref(false)
  const isAttachLoading = ref(false)
  const isAttaching = ref(false)

  async function loadSites() {
    const id = toValue(missionId)
    if (!id) return
    isSitesLoading.value = true
    try { await store.loadMissionSites(id) }
    catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sites de cette mission.')) }
    finally { isSitesLoading.value = false }
  }

  async function openAttachDialog() {
    attachDialog.value = true
    isAttachLoading.value = true
    // Liste complète des sites, pour proposer tous ceux qui n'ont pas encore de mission.
    try { await store.loadSites(true) }
    catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sites.')) }
    finally { isAttachLoading.value = false }
  }

  async function attachSites(siteIds: string[]) {
    const id = toValue(missionId)
    if (!id) return
    isAttaching.value = true
    try {
      const { assigned } = await store.attachSitesToMission(id, siteIds)
      attachDialog.value = false
      feedback.success(!assigned.length ? 'Ces sites étaient déjà attribués à la mission.' : assigned.length > 1 ? `${assigned.length} sites attribués à la mission.` : 'Site attribué à la mission.')
      void loadSites()
    } catch (error) {
      // Tout ou rien : rien n'a changé, pas de rechargement.
      feedback.error(attachSitesErrorMessage(error, (siteId) => store.getSiteById(siteId)?.name ?? 'Site inconnu'))
    } finally { isAttaching.value = false }
  }

  watch(() => toValue(missionId), () => { void loadSites() }, { immediate: true })

  return { missionSites, availableSites, isSitesLoading, attachDialog, isAttachLoading, isAttaching, openAttachDialog, attachSites }
}
