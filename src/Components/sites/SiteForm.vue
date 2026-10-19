<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import SiteMapPicker from '@/Components/sites/SiteMapPicker.vue'
import type { EnterpriseUser, Site, SiteInput } from '@/types/administrator'

const props = defineProps<{ site?: Site; managers: EnterpriseUser[] }>()
const emit = defineEmits<{ submit: [payload: SiteInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const data = reactive<SiteInput>({
  name: props.site?.name ?? '', address: props.site?.address ?? '', city: props.site?.city ?? '',
  latitude: props.site?.latitude ?? '', longitude: props.site?.longitude ?? '',
  radiusM: props.site?.radiusM ?? 100, managerId: props.site?.managerId ?? undefined,
})
const required = (value: string) => Boolean(String(value ?? '').trim()) || 'Ce champ est obligatoire'
const validRadius = (value?: number) => !value || (value >= 30 && value <= 1000) || 'Le rayon doit être compris entre 30 et 1 000 mètres'
const validLatitude = (value?: string) => !value || (Number(value) >= -90 && Number(value) <= 90) || 'Latitude invalide'
const validLongitude = (value?: string) => !value || (Number(value) >= -180 && Number(value) <= 180) || 'Longitude invalide'
const managerName = (item: EnterpriseUser) => `${item.firstName} ${item.lastName}`
watch(data, () => emit('dirtyChange', true), { deep: true })
async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { ...data })
}
</script>

<template>
  <v-form ref="form" @submit.prevent="submit">
    <div class="space-y-6">
      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-plus-outline" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Informations du site</h2><p class="mt-1 text-xs font-normal text-[#747985]">Nom, adresse et responsable opérationnel</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-text-field v-model="data.name" label="Nom du site" :rules="[required]" />
          <v-text-field v-model="data.city" label="Ville (facultatif)" />
          <v-text-field v-model="data.address" label="Adresse (facultatif)" class="md:col-span-2" />
          <v-select v-model="data.managerId" label="Superviseur responsable (facultatif)" :items="managers" :item-title="managerName" item-value="id" placeholder="Dérouler la liste"/>
          <v-alert class="md:col-span-2" type="info" variant="tonal">Vous pouvez enregistrer le site maintenant et compléter sa configuration plus tard.</v-alert>
        </v-card-text>
      </v-card>
      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-crosshairs-gps" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">Périmètre de pointage</h2><p class="mt-1 text-xs font-normal text-[#747985]">Coordonnées GPS et rayon de présence autorisé</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="space-y-5 px-6 py-6">
          <SiteMapPicker
            v-model:latitude="data.latitude"
            v-model:longitude="data.longitude"
            v-model:address="data.address"
            :radius-m="data.radiusM"
          />
          <div class="grid gap-x-5 gap-y-2 md:grid-cols-3">
            <v-text-field v-model="data.latitude" label="Latitude (facultatif)" inputmode="decimal" :rules="[validLatitude]" />
            <v-text-field v-model="data.longitude" label="Longitude (facultatif)" inputmode="decimal" :rules="[validLongitude]" />
            <v-text-field v-model.number="data.radiusM" label="Rayon" suffix="m" type="number" min="30" max="1000" :rules="[validRadius]" />
          </div>
          <v-alert type="info" variant="tonal" text="Le cercle rouge représente la zone de pointage autorisée. Le QR code sera généré après l’enregistrement." />
        </v-card-text>
      </v-card>
    </div>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn variant="outlined" color="secondary" size="large" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn>
      <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline">{{ site ? 'Enregistrer les modifications' : 'Créer le site' }}</v-btn>
    </div>
  </v-form>
</template>
