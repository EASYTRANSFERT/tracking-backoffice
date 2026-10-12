<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Offer, OfferInput } from '@/types/operator'

const props = withDefaults(defineProps<{ offer?: Offer; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ submit: [payload: OfferInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const formData = reactive<OfferInput>({
  name: props.offer?.name ?? '',
  description: props.offer?.description ?? '',
  price: props.offer?.price ?? 0,
  maxActiveAgents: props.offer?.maxActiveAgents ?? 25,
  status: props.offer?.status ?? 'active',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const positive = (value: number) => value > 0 || 'La valeur doit être supérieure à zéro'

watch(formData, () => emit('dirtyChange', true), { deep: true })

async function handleSubmit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { ...formData })
}

function handleCancel() {
  emit('dirtyChange', false)
  emit('cancel')
}
</script>

<template>
  <v-form ref="form" :aria-busy="loading" @submit.prevent="handleSubmit">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg" size="40"><v-icon icon="mdi-cash-multiple" color="primary" /></v-avatar>
        <div><h2 class="text-base font-bold">Informations de l’offre</h2><p class="mt-1 text-xs font-normal text-[#747985]">Définissez la formule et ses limites d’utilisation</p></div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
        <v-text-field v-model="formData.name" label="Libellé de l’offre" :rules="[required]" />
        <v-select v-model="formData.status" label="Statut" :items="[{ title: 'Active', value: 'active' }, { title: 'Inactive', value: 'inactive' }]" />
        <v-text-field v-model.number="formData.price" label="Prix mensuel" type="number" suffix="FCFA" min="1" :rules="[positive]" />
        <v-text-field v-model.number="formData.maxActiveAgents" label="Nombre maximum d’agents actifs" type="number" min="1" :rules="[positive]" />
        <v-textarea v-model="formData.description" label="Description" rows="4" :rules="[required]" class="md:col-span-2" />
      </v-card-text>
    </v-card>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn variant="outlined" color="secondary" size="large" :disabled="loading" @click="handleCancel">Annuler</v-btn>
      <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading" :disabled="loading">{{ offer ? 'Enregistrer les modifications' : 'Créer l’offre' }}</v-btn>
    </div>
  </v-form>
</template>
