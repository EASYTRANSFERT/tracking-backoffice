<script setup lang="ts">
import { ref, watch } from 'vue'

import { fullName } from '@/utils/people'
import type { EnterpriseUser } from '@/types/administrator'

const props = defineProps<{ modelValue: boolean; supervisors: EnterpriseUser[]; currentId?: string; loading?: boolean; saving?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [supervisorUserId: string] }>()

const selected = ref<string>()
watch(() => props.modelValue, (open) => { if (open) selected.value = props.currentId })
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="px-6 pt-6"><h2 class="text-lg font-bold">Superviseur de la mission</h2><p class="mt-1 text-sm font-normal text-[#747985]">Il suit la mission, ses équipes et leurs agents depuis le back-office.</p></v-card-title>
      <v-card-text class="px-6 py-4">
        <v-select
          v-model="selected"
          label="Superviseur"
          :items="supervisors"
          :item-title="fullName"
          item-value="id"
          :loading="loading"
          autofocus
          no-data-text="Aucun superviseur actif : créez d’abord un compte au rôle Superviseur."
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="!selected || selected === currentId" @click="selected && emit('confirm', selected)">Attribuer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
