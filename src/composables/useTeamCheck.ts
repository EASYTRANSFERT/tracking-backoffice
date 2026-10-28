import { isAxiosError } from 'axios'
import { storeToRefs } from 'pinia'

import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { ApiProblemDetails } from '@/types/api'

// Refus prévus par POST /checks/trigger, reformulés pour l'administrateur et le superviseur.
const refusals: Record<string, string> = {
  CHECK_NO_OPEN_SESSION: 'Aucun agent de cette équipe n’est pointé en ce moment : il n’y a personne à contrôler.',
  CHECK_TEAM_WITHOUT_LEAD: 'Cette équipe n’a pas de chef d’équipe pour répondre au contrôle.',
  CHECK_TRIGGER_RATE_LIMITED: 'Un contrôle a déjà été lancé pour cette équipe il y a moins d’une heure.',
}

const formatTime = (value: string) => new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }).format(new Date(value))

/** Lancement d'un contrôle de présence d'équipe, partagé par l'administrateur et le superviseur. */
export function useTeamCheck() {
  const store = useAttendanceStore()
  const feedback = useUiFeedbackStore()

  async function trigger(teamId: string, teamName: string) {
    const confirmed = await feedback.askConfirmation({
      title: 'Lancer un contrôle de présence ?',
      message: `Le chef de l’équipe « ${teamName} » devra confirmer la présence de chaque agent pointé, avec un selfie, avant la fin du délai (15 min par défaut).`,
      confirmText: 'Lancer le contrôle',
    })
    if (!confirmed) return

    try {
      const campaign = await store.triggerTeamCheck(teamId)
      const count = campaign.checks.length
      feedback.success(`Contrôle lancé : ${count} agent${count > 1 ? 's' : ''} à confirmer avant ${formatTime(campaign.deadlineAt)}.`)
    } catch (error) {
      const code = isAxiosError<ApiProblemDetails>(error) ? error.response?.data?.code : undefined
      feedback.error(code && refusals[code] ? refusals[code] : getApiErrorMessage(error, 'Impossible de lancer le contrôle.'))
    }
  }

  return { triggeringTeamId: storeToRefs(store).triggeringTeamId, trigger }
}
