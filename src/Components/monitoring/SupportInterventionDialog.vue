<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Company, SupportIntervention } from '@/types/operator'

const props = defineProps<{ modelValue: boolean; companies: Company[] }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: Omit<SupportIntervention, 'id' | 'createdAt' | 'status'>]
}>()
const form = ref()
const formData = reactive<{
  subject: string
  companyName: string
  priority: SupportIntervention['priority']
}>({ subject: '', companyName: '', priority: 'medium' })
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) Object.assign(formData, { subject: '', companyName: '', priority: 'medium' })
})

async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('submit', { ...formData })
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 pt-6">
        <v-avatar color="red-lighten-5"><v-icon icon="mdi-lifebuoy" color="primary" /></v-avatar>
        <div><h2 class="text-lg font-bold">Nouvelle intervention</h2><p class="mt-1 text-xs font-normal text-[#747985]">Tracez une action de support liée à une entreprise.</p></div>
      </v-card-title>
      <v-form ref="form" @submit.prevent="submit">
        <v-card-text class="space-y-1 px-6 py-5">
          <v-text-field v-model="formData.subject" label="Objet de l’intervention" :rules="[required]" />
          <v-select v-model="formData.companyName" label="Entreprise concernée" :items="companies" item-title="legalName" item-value="legalName" :rules="[required]" />
          <v-select v-model="formData.priority" label="Priorité" :items="[{ title: 'Faible', value: 'low' }, { title: 'Moyenne', value: 'medium' }, { title: 'Élevée', value: 'high' }]" />
        </v-card-text>
        <v-card-actions class="px-6 pb-6"><v-spacer /><v-btn variant="text" @click="emit('update:modelValue', false)">Annuler</v-btn><v-btn type="submit" color="primary" variant="flat">Créer l’intervention</v-btn></v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
