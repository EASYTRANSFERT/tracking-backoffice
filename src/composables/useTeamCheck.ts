import { isAxiosError } from 'axios'
import { storeToRefs } from 'pinia'

import { useAttendanceStore } from '@/stores/attendance.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import { checkRefusals } from '@/utils/check-schedule'
import type { ApiProblemDetails } from '@/types/api'

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
      feedback.error(code && checkRefusals[code] ? checkRefusals[code] : getApiErrorMessage(error, 'Impossible de lancer le contrôle.'))
    }
  }

  return { triggeringTeamId: storeToRefs(store).triggeringTeamId, trigger }
}
