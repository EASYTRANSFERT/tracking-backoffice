import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export type FeedbackColor = 'success' | 'error' | 'warning' | 'info'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  color?: FeedbackColor
}

export const useUiFeedbackStore = defineStore('ui-feedback', () => {
  const snackbar = reactive({
    visible: false,
    message: '',
    color: 'success' as FeedbackColor,
    timeout: 4000,
  })

  const confirmation = reactive({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    color: 'warning' as FeedbackColor,
  })

  /* Après une fin de session, la page quittée ne doit afficher aucune erreur. */
  const errorsMuted = ref(false)

  let confirmationResolver: ((confirmed: boolean) => void) | null = null

  function notify(message: string, color: FeedbackColor = 'success', timeout = 4000) {
    Object.assign(snackbar, { visible: true, message, color, timeout })
  }

  function success(message: string) { notify(message, 'success') }
  function error(message: string) {
    if (errorsMuted.value) return
    notify(message, 'error', 6000)
  }

  function muteErrors() {
    errorsMuted.value = true
    snackbar.visible = false
  }

  function unmuteErrors() {
    errorsMuted.value = false
  }
  function warning(message: string) { notify(message, 'warning', 5000) }
  function info(message: string) { notify(message, 'info') }

  function askConfirmation(options: ConfirmationOptions): Promise<boolean> {
    confirmationResolver?.(false)

    Object.assign(confirmation, {
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText ?? 'Confirmer',
      cancelText: options.cancelText ?? 'Annuler',
      color: options.color ?? 'warning',
    })

    return new Promise((resolve) => {
      confirmationResolver = resolve
    })
  }

  function resolveConfirmation(confirmed: boolean) {
    confirmation.visible = false
    confirmationResolver?.(confirmed)
    confirmationResolver = null
  }

  return {
    snackbar,
    confirmation,
    notify,
    success,
    error,
    warning,
    info,
    muteErrors,
    unmuteErrors,
    askConfirmation,
    resolveConfirmation,
  }
})
