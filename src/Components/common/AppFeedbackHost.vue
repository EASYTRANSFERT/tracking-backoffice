<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AppConfirmDialog from '@/Components/common/AppConfirmDialog.vue'
import AppSnackbar from '@/Components/common/AppSnackbar.vue'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const feedback = useUiFeedbackStore()
const { snackbar, confirmation } = storeToRefs(feedback)
</script>

<template>
  <AppSnackbar
    v-model="snackbar.visible"
    :message="snackbar.message"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
  />

  <AppConfirmDialog
    :model-value="confirmation.visible"
    :title="confirmation.title"
    :message="confirmation.message"
    :confirm-text="confirmation.confirmText"
    :cancel-text="confirmation.cancelText"
    :color="confirmation.color"
    @confirm="feedback.resolveConfirmation(true)"
    @cancel="feedback.resolveConfirmation(false)"
  />
</template>
