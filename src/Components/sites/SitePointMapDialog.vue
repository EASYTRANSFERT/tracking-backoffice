<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useDisplay } from 'vuetify'
import * as L from 'leaflet'
import AppDialogClose from '@/Components/common/AppDialogClose.vue'

import LocationAutocomplete from '@/Components/sites/LocationAutocomplete.vue'
import { addTileLayer, DEFAULT_CENTER, DEFAULT_ZOOM, formatCoordinates, perimeterLayer, POINT_ZOOM, pointIcon, toLatLng } from '@/Components/sites/site-map'
import { useGeocodingStore } from '@/stores/geocoding.store'
import type { SitePoint } from '@/types/administrator'
import type { GeocodingResult } from '@/types/geocoding'

const props = defineProps<{
  modelValue: boolean
  pointIndex: number
  points: (SitePoint | null)[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [point: SitePoint]
  /** Un autre point du périmètre, déplacé dans cette boîte : appliqué à la validation. */
  move: [index: number, point: SitePoint]
}>()

const { smAndDown } = useDisplay()
const geocodingStore = useGeocodingStore()

const mapElement = ref<HTMLElement | null>(null)
const draft = ref<SitePoint | null>(null)
const isFindingAddress = ref(false)
const isLocating = ref(false)
const locationError = ref<string | null>(null)
const pointNumber = computed(() => props.pointIndex + 1)
const searchValue = ref<GeocodingResult | null>(null)

// Autres points déplacés ici : appliqués à la validation, abandonnés à l'annulation.
const moved = ref<Record<number, SitePoint>>({})
const movedCount = computed(() => Object.keys(moved.value).length)
const hasOtherPoints = computed(() => props.points.some((point, index) => index !== props.pointIndex && point))
const movedAddressRequests = new Map<number, number>()

let map: L.Map | null = null
let layers: L.LayerGroup | null = null
let addressRequest = 0

function close() {
  emit('update:modelValue', false)
}

function refreshLayers() {
  if (!map) return
  layers?.clearLayers()
  layers ??= L.layerGroup().addTo(map)

  const positions: L.LatLng[] = []
  props.points.forEach((point, index) => {
    const current = index === props.pointIndex ? draft.value : (moved.value[index] ?? point)
    if (!current) return
    const position = toLatLng(current)
    positions.push(position)

    const isActive = index === props.pointIndex
    const marker = L.marker(position, {
      icon: pointIcon(index + 1, isActive),
      draggable: true,
      zIndexOffset: isActive ? 1000 : 0,
      title: isActive ? `Point ${index + 1}` : `Point ${index + 1} : glisser pour le déplacer`,
    })
    marker.on('dragend', () => (isActive ? placePoint(marker.getLatLng()) : movePoint(index, marker.getLatLng())))
    layers?.addLayer(marker)
  })

  const perimeter = perimeterLayer(positions)
  if (perimeter) layers.addLayer(perimeter)
}

async function placePoint(position: L.LatLng, address?: string) {
  const request = ++addressRequest
  draft.value = { latitude: Number(position.lat.toFixed(6)), longitude: Number(position.lng.toFixed(6)), address }
  refreshLayers()
  if (address) {
    isFindingAddress.value = false
    return
  }

  isFindingAddress.value = true
  const foundAddress = await geocodingStore.findAddress(draft.value)
  if (request !== addressRequest || !draft.value) return
  draft.value = { ...draft.value, address: foundAddress ?? undefined }
  isFindingAddress.value = false
}

async function movePoint(index: number, position: L.LatLng) {
  const request = (movedAddressRequests.get(index) ?? 0) + 1
  movedAddressRequests.set(index, request)
  const point: SitePoint = { latitude: Number(position.lat.toFixed(6)), longitude: Number(position.lng.toFixed(6)) }
  moved.value = { ...moved.value, [index]: point }
  refreshLayers()
  const address = await geocodingStore.findAddress(point)
  if (movedAddressRequests.get(index) !== request) return
  moved.value = { ...moved.value, [index]: { ...point, address: address ?? undefined } }
}

function selectResult(result: GeocodingResult | null) {
  searchValue.value = result
  if (!result) return
  const position = L.latLng(result.latitude, result.longitude)
  void placePoint(position, result.displayName)
  map?.setView(position, POINT_ZOOM)
}

async function useCurrentLocation() {
  locationError.value = null
  isLocating.value = true
  try {
    const position = await geocodingStore.locateCurrentPosition()
    const latLng = L.latLng(position.latitude, position.longitude)
    void placePoint(latLng)
    map?.setView(latLng, POINT_ZOOM)
  } catch (error) {
    locationError.value = error instanceof Error ? error.message : 'Impossible d’obtenir votre position actuelle.'
  } finally {
    isLocating.value = false
  }
}

function initialView() {
  if (!map) return
  if (draft.value) {
    map.setView(toLatLng(draft.value), POINT_ZOOM)
    return
  }
  const placed = props.points.filter((point): point is SitePoint => Boolean(point)).map(toLatLng)
  if (placed.length === 1) map.setView(placed[0]!, POINT_ZOOM)
  else if (placed.length > 1) map.fitBounds(L.latLngBounds(placed), { padding: [48, 48] })
  else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
}

// La carte est créée une fois la boîte de dialogue affichée, sinon Leaflet calcule une taille nulle.
function onOpened() {
  if (!mapElement.value) return
  const current = props.points[props.pointIndex]
  draft.value = current ? { ...current } : null
  searchValue.value = null
  locationError.value = null
  moved.value = {}

  map = L.map(mapElement.value, { zoomControl: true, keyboard: true, tapHold: false })
  addTileLayer(map)
  map.on('click', (event: L.LeafletMouseEvent) => void placePoint(event.latlng))
  initialView()
  refreshLayers()
}

// Le contenu de la boîte de dialogue est retiré du DOM à la fermeture : la carte est recréée à chaque ouverture.
function destroyMap() {
  map?.remove()
  map = null
  layers = null
}

function onClosed() {
  addressRequest += 1
  isFindingAddress.value = false
  draft.value = null
  moved.value = {}
  movedAddressRequests.clear()
  destroyMap()
}

function confirm() {
  if (!draft.value && !movedCount.value) return
  Object.entries(moved.value).forEach(([index, point]) => emit('move', Number(index), point))
  if (draft.value) emit('confirm', { ...draft.value })
  close()
}

onBeforeUnmount(destroyMap)
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="smAndDown"
    max-width="960"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
    @after-enter="onOpened"
    @after-leave="onClosed"
  >
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-4 pr-16">
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d80f16] text-sm font-bold text-white">{{ pointNumber }}</span>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-bold">Placer le point {{ pointNumber }}</h2>
          <p class="text-xs font-normal text-[#747985]">Touchez la carte ou recherchez un lieu, puis ajustez en déplaçant le marqueur.</p>
        </div>
        <AppDialogClose @close="close" />
      </v-card-title>
      <v-divider />
      <v-card-text class="space-y-4 px-6 py-5">
        <div class="grid gap-3 md:grid-cols-[1fr_auto]">
          <LocationAutocomplete
            :model-value="searchValue"
            label="Rechercher une adresse ou un lieu"
            hide-details
            @update:model-value="selectResult"
          />
          <v-btn
            color="secondary"
            variant="outlined"
            height="56"
            :loading="isLocating"
            prepend-icon="mdi-crosshairs-gps"
            @click="useCurrentLocation"
          >
            Ma position
          </v-btn>
        </div>

        <v-alert v-if="locationError" type="warning" variant="tonal" density="compact" :text="locationError" />

        <div class="overflow-hidden rounded-xl border border-[#d9dce2] bg-[#eef1f4]">
          <div
            ref="mapElement"
            class="z-0 h-[52vh] min-h-[320px] w-full cursor-crosshair"
            role="application"
            :aria-label="`Carte de sélection du point ${pointNumber}`"
            tabindex="0"
          />
        </div>

        <p v-if="hasOtherPoints" class="text-xs text-[#747985]">
          Vous pouvez aussi faire glisser les autres points pour les ajuster.
          <strong v-if="movedCount" class="text-[#292d38]">{{ movedCount }} autre{{ movedCount > 1 ? 's' : '' }} point{{ movedCount > 1 ? 's' : '' }} déplacé{{ movedCount > 1 ? 's' : '' }}, appliqué{{ movedCount > 1 ? 's' : '' }} à la validation.</strong>
        </p>

        <div class="flex min-h-12 items-start gap-2 text-sm">
          <v-icon :icon="draft ? 'mdi-map-marker-check-outline' : 'mdi-gesture-tap'" :color="draft ? 'primary' : undefined" size="20" class="mt-0.5" />
          <div v-if="draft" class="min-w-0">
            <p class="font-medium text-[#292d38]">
              <template v-if="isFindingAddress">Recherche de l’adresse…</template>
              <template v-else>{{ draft.address || 'Adresse introuvable pour ce point' }}</template>
            </p>
            <p class="text-xs text-[#747985]">{{ formatCoordinates(draft) }}</p>
          </div>
          <p v-else class="text-[#747985]">Touchez la carte pour placer le point {{ pointNumber }}.</p>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions class="flex-col-reverse gap-3 px-6 py-4 sm:flex-row sm:justify-end">
        <v-btn variant="outlined" color="secondary" @click="close">Annuler</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-check" :disabled="!draft && !movedCount" @click="confirm">
          {{ movedCount ? 'Valider les modifications' : 'Valider le point' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
