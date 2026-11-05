<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import LocationAutocomplete from '@/Components/sites/LocationAutocomplete.vue'
import SitePerimeterMap from '@/Components/sites/SitePerimeterMap.vue'
import SitePointMapDialog from '@/Components/sites/SitePointMapDialog.vue'
import { delimitsSurface, formatCoordinates, SITE_POINT_COUNT, SITE_POINT_MAX } from '@/Components/sites/site-map'
import { MIN_TOLERANCE_RADIUS_M, toleranceRadiusRule } from '@/utils/site-radius'
import type { SitePoint } from '@/types/administrator'
import type { GeocodingResult } from '@/types/geocoding'

/** Étape « Périmètre » du formulaire de site : points du contour et rayon de tolérance. */
const props = defineProps<{
  /** Vrai quand l'étape est affichée : Leaflet ne peut pas dimensionner une carte masquée. */
  active?: boolean
}>()
const emit = defineEmits<{ firstAddress: [address: string] }>()
const points = defineModel<(SitePoint | null)[]>('points', { required: true })
const radiusM = defineModel<number | undefined>('radiusM')

const form = ref()
const mapDialogOpen = ref(false)
const mapPointIndex = ref(0)
const perimeterError = ref<string | null>(null)
const placedPoints = computed(() => points.value.filter((point): point is SitePoint => Boolean(point)))
const placedCount = computed(() => placedPoints.value.length)
const isFlatPerimeter = computed(() => placedCount.value >= SITE_POINT_COUNT && !delimitsSurface(placedPoints.value))
// Facultatif : vide, l'API reprend le rayon par défaut de l'entreprise ; saisi, il est d'au moins 100 m.
const radiusRule = (value?: number | string) => value === undefined || value === '' || toleranceRadiusRule(value)
// Un point se débloque quand le précédent est placé.
const isPointEnabled = (index: number) => index === 0 || Boolean(points.value[index - 1] || points.value[index])
const pointAsResult = (point: SitePoint | null, index: number): GeocodingResult | null => point
  ? { id: `point-${index}`, displayName: point.address || formatCoordinates(point), latitude: point.latitude, longitude: point.longitude }
  : null
watch(placedCount, () => { perimeterError.value = null })

function setPoint(index: number, point: SitePoint | null) {
  points.value = points.value.map((item, position) => position === index ? point : item)
  if (index === 0 && point?.address) emit('firstAddress', point.address)
}
function setPointFromResult(index: number, result: GeocodingResult | null) {
  setPoint(index, result ? { latitude: result.latitude, longitude: result.longitude, address: result.displayName } : null)
}
// Le contour part de trois points ; on peut en ajouter autant que nécessaire (50 au plus, limite de l'API).
const canAddPoint = computed(() => points.value.length < SITE_POINT_MAX && Boolean(points.value.at(-1)))
function addPoint() {
  if (canAddPoint.value) points.value = [...points.value, null]
}
// Les trois premiers points sont obligatoires : seuls les points ajoutés se retirent.
function removePoint(index: number) {
  if (index >= SITE_POINT_COUNT) points.value = points.value.filter((_, position) => position !== index)
}
function openMap(index: number) {
  mapPointIndex.value = index
  mapDialogOpen.value = true
}

async function validate() {
  const result = await form.value?.validate()
  if (placedCount.value < SITE_POINT_COUNT) {
    perimeterError.value = `Ajoutez au moins ${SITE_POINT_COUNT} points du périmètre pour positionner le site.`
    return false
  }
  return Boolean(result?.valid) && !isFlatPerimeter.value
}
defineExpose({ validate })
</script>

<template>
  <v-form ref="form" @submit.prevent>
    <v-card-text class="space-y-5 px-6 py-6">
      <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert-outline">
        Pour positionner le site sur la carte, vous devez renseigner au moins trois points délimitant son périmètre. Vous pouvez en ajouter d’autres pour épouser la forme du site.
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
          <v-btn
            class="mt-2"
            icon="mdi-map-marker-plus-outline"
            color="primary"
            variant="tonal"
            :disabled="!isPointEnabled(index)"
            :aria-label="`Placer le point ${index + 1} sur la carte`"
            @click="openMap(index)"
          />
          <!-- Colonne réservée dès qu'il y a des points ajoutés : tous les boutons de carte restent alignés. -->
          <div v-if="points.length > SITE_POINT_COUNT" class="mt-2 w-10 shrink-0">
            <v-btn v-if="index >= SITE_POINT_COUNT" icon="mdi-close" color="error" variant="text" :aria-label="`Retirer le point ${index + 1}`" @click="removePoint(index)" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-3">
          <p v-if="points.length >= SITE_POINT_MAX" class="text-xs text-[#747985]">Maximum de {{ SITE_POINT_MAX }} points atteint.</p>
          <v-btn variant="outlined" color="primary" prepend-icon="mdi-plus" :disabled="!canAddPoint" @click="addPoint">Ajouter un point</v-btn>
        </div>
      </div>
      <v-alert v-if="isFlatPerimeter" type="error" variant="tonal" density="compact" text="Les points sont alignés ou confondus : ils doivent délimiter une surface, pas une ligne." />
      <v-alert v-if="perimeterError" type="error" variant="tonal" density="compact" :text="perimeterError" />
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-[#747985]">
          <p>Aperçu du périmètre</p>
          <p class="font-medium" :class="placedCount === points.length ? 'text-[#2e7d4f]' : 'text-[#535865]'">{{ placedCount }} / {{ points.length }} points</p>
        </div>
        <SitePerimeterMap v-if="props.active" :points="points" @select="openMap" />
      </div>
      <v-text-field
        v-model.number="radiusM"
        class="max-w-xs"
        type="number"
        :min="MIN_TOLERANCE_RADIUS_M"
        label="Rayon de tolérance"
        base-color="primary"
        prepend-inner-icon="mdi-map-marker-radius-outline"
        suffix="m"
        placeholder="100"
        persistent-placeholder
        hint="Optionnel"
        persistent-hint
        :rules="[radiusRule]"
      />
    </v-card-text>
    <SitePointMapDialog v-model="mapDialogOpen" :point-index="mapPointIndex" :points="points" @confirm="setPoint(mapPointIndex, $event)" @move="setPoint" />
  </v-form>
</template>
