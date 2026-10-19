<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import LocationAutocomplete from '@/Components/sites/LocationAutocomplete.vue'
import SitePerimeterMap from '@/Components/sites/SitePerimeterMap.vue'
import SitePointMapDialog from '@/Components/sites/SitePointMapDialog.vue'
import { formatCoordinates, SITE_POINT_COUNT } from '@/Components/sites/site-map'
import type { EnterpriseUser, Site, SiteInput, SitePoint } from '@/types/administrator'
import type { GeocodingResult } from '@/types/geocoding'

const props = defineProps<{ site?: Site; managers: EnterpriseUser[] }>()
const emit = defineEmits<{ submit: [payload: SiteInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const data = reactive<SiteInput>({
  name: props.site?.name ?? '', address: props.site?.address ?? '', city: props.site?.city ?? '',
  latitude: props.site?.latitude ?? '', longitude: props.site?.longitude ?? '',
  managerId: props.site?.managerId ?? undefined,
})
const points = ref<(SitePoint | null)[]>(Array.from({ length: SITE_POINT_COUNT }, (_, index) => props.site?.points?.[index] ?? null))
const placedCount = computed(() => points.value.filter(Boolean).length)
const mapDialogOpen = ref(false)
const mapPointIndex = ref(0)
const perimeterError = ref<string | null>(null)
const required = (value: string) => Boolean(String(value ?? '').trim()) || 'Ce champ est obligatoire'
const managerName = (item: EnterpriseUser) => `${item.firstName} ${item.lastName}`
// Un point se débloque quand le précédent est placé.
const isPointEnabled = (index: number) => index === 0 || Boolean(points.value[index - 1] || points.value[index])
const pointAsResult = (point: SitePoint | null, index: number): GeocodingResult | null => point
  ? { id: `point-${index}`, displayName: point.address || formatCoordinates(point), latitude: point.latitude, longitude: point.longitude }
  : null
watch([data, points], () => emit('dirtyChange', true), { deep: true })
watch(placedCount, () => { perimeterError.value = null })

function setPoint(index: number, point: SitePoint | null) {
  points.value[index] = point
  if (index === 0 && point?.address && !data.address?.trim()) data.address = point.address
}
function setPointFromResult(index: number, result: GeocodingResult | null) {
  setPoint(index, result ? { latitude: result.latitude, longitude: result.longitude, address: result.displayName } : null)
}
function openMap(index: number) {
  mapPointIndex.value = index
  mapDialogOpen.value = true
}
async function submit() {
  const result = await form.value?.validate()
  if (placedCount.value > 0 && placedCount.value < SITE_POINT_COUNT) {
    perimeterError.value = `Ajoutez les ${SITE_POINT_COUNT} points du périmètre, ou retirez-les pour le compléter plus tard.`
    return
  }
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { ...data, points: points.value.filter((point): point is SitePoint => Boolean(point)) })
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
          <div><h2 class="text-base font-bold">Périmètre de pointage</h2><p class="mt-1 text-xs font-normal text-[#747985]">Trois points délimitant la zone de présence autorisée</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="space-y-5 px-6 py-6">
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert-outline">
            Pour positionner le site sur la carte, vous devez renseigner trois points délimitant son périmètre.
          </v-alert>
          <div class="space-y-3">
            <div v-for="(point, index) in points" :key="index" class="flex items-start gap-3">
              <span
                class="mt-4 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                :class="point ? 'bg-[#d80f16] text-white' : 'border-2 border-[#d9dce2] text-[#747985]'"
              >{{ index + 1 }}</span>
              <LocationAutocomplete
                class="min-w-0 flex-1"
                :model-value="pointAsResult(point, index)"
                :label="`Adresse du point ${index + 1}`"
                :hint="point ? formatCoordinates(point) : undefined"
                :disabled="!isPointEnabled(index)"
                @update:model-value="setPointFromResult(index, $event)"
              />
              <v-tooltip :text="`Placer le point ${index + 1} sur la carte`" location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    class="mt-2"
                    icon="mdi-map-marker-plus-outline"
                    color="primary"
                    variant="tonal"
                    :disabled="!isPointEnabled(index)"
                    :aria-label="`Placer le point ${index + 1} sur la carte`"
                    @click="openMap(index)"
                  />
                </template>
              </v-tooltip>
            </div>
          </div>
          <v-alert v-if="perimeterError" type="error" variant="tonal" density="compact" :text="perimeterError" />
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-[#747985]">
              <p>Aperçu du périmètre</p>
              <p class="font-medium" :class="placedCount === SITE_POINT_COUNT ? 'text-[#2e7d4f]' : 'text-[#535865]'">{{ placedCount }} / {{ SITE_POINT_COUNT }} points</p>
            </div>
            <SitePerimeterMap :points="points" @select="openMap" />
          </div>
          <v-alert type="info" variant="tonal" text="La zone formée par les trois points représente le périmètre de pointage. Le QR code sera généré après l’enregistrement." />
        </v-card-text>
      </v-card>
    </div>
    <SitePointMapDialog v-model="mapDialogOpen" :point-index="mapPointIndex" :points="points" @confirm="setPoint(mapPointIndex, $event)" />
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn variant="outlined" color="secondary" size="large" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn>
      <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline">{{ site ? 'Enregistrer les modifications' : 'Créer le site' }}</v-btn>
    </div>
  </v-form>
</template>
