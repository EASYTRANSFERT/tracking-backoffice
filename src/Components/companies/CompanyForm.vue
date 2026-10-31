<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Company, CompanyInput, Offer } from '@/types/operator'

const props = withDefaults(defineProps<{ company?: Company; offers: Offer[]; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ submit: [payload: CompanyInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const formData = reactive<CompanyInput>({
  legalName: props.company?.legalName ?? '',
  country: props.company?.country ?? 'CI',
  timezone: props.company?.timezone ?? 'Africa/Abidjan',
  contractFrom: props.company?.contractFrom?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  contractTo: props.company?.contractTo?.slice(0, 10) ?? '',
  offerId: props.company?.offerId ?? '',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'

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
    <div class="space-y-6">
      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg" size="40"><v-icon icon="mdi-domain" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Informations de l’entreprise</h2><p class="mt-1 text-xs font-normal text-[#747985]">Contrat exact attendu par l’API plateforme</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-text-field v-model="formData.legalName" label="Nom l'entreprise" :rules="[required]" />
          <v-select v-model="formData.country" label="Pays" :items="[{title:'Côte d’Ivoire',value:'CI'},{title:'Sénégal',value:'SN'},{title:'Mali',value:'ML'},{title:'Burkina Faso',value:'BF'},{title:'Bénin',value:'BJ'}]" :rules="[required]" />
          <v-select v-model="formData.timezone" label="Fuseau horaire" :items="['Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako', 'Africa/Ouagadougou', 'Africa/Porto-Novo']" :rules="[required]" />
          <v-text-field v-model="formData.contractFrom" label="Début du contrat" type="date" :rules="[required]" />
          <v-text-field v-model="formData.contractTo" label="Fin du contrat (facultatif)" type="date" />
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg" size="40"><v-icon icon="mdi-account-key-outline" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Offre attribuée</h2><p class="mt-1 text-xs font-normal text-[#747985]">L’entreprise doit porter une offre avant son activation.</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-select v-model="formData.offerId" label="Offre attribuée" :items="offers.filter((offer) => offer.status === 'active')" item-title="name" item-value="id" />
        </v-card-text>
      </v-card>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <v-btn variant="outlined" color="secondary" size="large" :disabled="loading" @click="handleCancel">Annuler</v-btn>
        <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading" :disabled="loading">{{ company ? 'Enregistrer les modifications' : 'Créer l’entreprise' }}</v-btn>
      </div>
    </div>
  </v-form>
</template>
