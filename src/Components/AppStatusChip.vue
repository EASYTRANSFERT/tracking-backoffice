<script setup lang="ts">
import { computed } from 'vue'

type Status =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'invited'
  | 'disabled'
  | 'scheduled'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'draft'

const props = defineProps<{
  status: Status
}>()

const statusConfig = computed(() => {
  return {
    active: { label: 'Actif', color: 'success', icon: 'mdi-check-circle' },
    inactive: { label: 'Inactive', color: 'secondary', icon: 'mdi-minus-circle' },
    pending: { label: 'En attente', color: 'warning', icon: 'mdi-clock' },
    suspended: { label: 'Suspendue', color: 'error', icon: 'mdi-cancel' },
    open: { label: 'Ouverte', color: 'error', icon: 'mdi-alert-circle' },
    in_progress: { label: 'En cours', color: 'warning', icon: 'mdi-progress-clock' },
    resolved: { label: 'Résolue', color: 'success', icon: 'mdi-check-circle' },
    invited: { label: 'Invité', color: 'info', icon: 'mdi-email-check-outline' },
    disabled: { label: 'Désactivé', color: 'secondary', icon: 'mdi-account-off-outline' },
    scheduled: { label: 'Planifiée', color: 'info', icon: 'mdi-calendar-clock' },
    ongoing: { label: 'En cours', color: 'warning', icon: 'mdi-progress-clock' },
    completed: { label: 'Terminée', color: 'success', icon: 'mdi-check-circle' },
    cancelled: { label: 'Annulée', color: 'error', icon: 'mdi-close-circle' },
    draft: { label: 'À compléter', color: 'info', icon: 'mdi-pencil-clock-outline' },
  }[props.status]
})
</script>

<template>
  <v-chip
    :color="statusConfig.color"
    :prepend-icon="statusConfig.icon"
    variant="tonal"
    size="small"
    class="min-w-[108px] justify-center font-weight-medium"
  >
    {{ statusConfig.label }}
  </v-chip>
</template>
