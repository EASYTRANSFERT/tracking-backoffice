<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Company, CompanyInput, Offer } from '@/types/operator'

const props = withDefaults(defineProps<{ company?: Company; offers: Offer[]; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ submit: [payload: CompanyInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const formData = reactive<CompanyInput>({
  legalName: props.company?.legalName ?? '',
  country: props.company?.country ?? 'Côte d’Ivoire',
  timezone: props.company?.timezone ?? 'Africa/Abidjan',
  contactName: props.company?.contactName ?? '',
  contactEmail: props.company?.contactEmail ?? '',
  contactPhone: props.company?.contactPhone ?? '',
  administratorName: props.company?.administratorName ?? '',
  administratorEmail: props.company?.administratorEmail ?? '',
  offerId: props.company?.offerId ?? '',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const email = (value: string) => /.+@.+\..+/.test(value) || 'Saisissez une adresse e-mail valide'

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
          <div><h2 class="text-base font-bold">Informations de l’entreprise</h2><p class="mt-1 text-xs font-normal text-[#747985]">Identité, localisation et contact principal</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-text-field v-model="formData.legalName" label="Raison sociale" :rules="[required]" />
          <v-select v-model="formData.country" label="Pays" :items="['Côte d’Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Bénin']" :rules="[required]" />
          <v-select v-model="formData.timezone" label="Fuseau horaire" :items="['Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako', 'Africa/Ouagadougou', 'Africa/Porto-Novo']" :rules="[required]" />
          <v-text-field v-model="formData.contactName" label="Nom du contact" :rules="[required]" />
          <v-text-field v-model="formData.contactEmail" label="E-mail du contact" type="email" :rules="[required, email]" />
          <v-text-field v-model="formData.contactPhone" label="Téléphone du contact" type="tel" :rules="[required]" />
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg" size="40"><v-icon icon="mdi-account-key-outline" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Offre et premier administrateur</h2><p class="mt-1 text-xs font-normal text-[#747985]">Attribuez une formule et préparez le premier accès</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-select v-model="formData.offerId" label="Offre attribuée" :items="offers.filter((offer) => offer.status === 'active')" item-title="name" item-value="id" :rules="[required]" />
          <div class="hidden md:block" />
          <v-text-field v-model="formData.administratorName" label="Nom de l’administrateur" :rules="[required]" />
          <v-text-field v-model="formData.administratorEmail" label="E-mail de l’administrateur" type="email" :rules="[required, email]" />
        </v-card-text>
      </v-card>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <v-btn variant="outlined" color="secondary" size="large" :disabled="loading" @click="handleCancel">Annuler</v-btn>
        <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading" :disabled="loading">{{ company ? 'Enregistrer les modifications' : 'Créer l’entreprise' }}</v-btn>
      </div>
    </div>
  </v-form>
</template>
