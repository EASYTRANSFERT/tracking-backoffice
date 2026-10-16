<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import * as L from 'leaflet'

import { useGeocodingStore } from '@/stores/geocoding.store'
import type { GeocodingResult } from '@/types/geocoding'

const props = withDefaults(defineProps<{
  latitude?: string
  longitude?: string
  radiusM?: number
  address?: string
}>(), {
  latitude: '',
  longitude: '',
  radiusM: 100,
  address: '',
})

const emit = defineEmits<{
  'update:latitude': [value: string]
  'update:longitude': [value: string]
  'update:address': [value: string]
}>()

const DEFAULT_CENTER: L.LatLngExpression = [5.3484, -4.0305]
const DEFAULT_ZOOM = 12
const SELECTED_ZOOM = 16

const mapElement = ref<HTMLElement | null>(null)
const searchQuery = ref(props.address)
const isLocating = ref(false)
const locationError = ref<string | null>(null)

const geocodingStore = useGeocodingStore()
const { results, isSearching, errorMessage } = storeToRefs(geocodingStore)

let map: L.Map | null = null
let marker: L.Marker | null = null
let radiusCircle: L.Circle | null = null

const siteIcon = L.divIcon({
  className: 'site-map-marker',
  html: '<span class="mdi mdi-map-marker"></span>',
  iconSize: [42, 42],
  iconAnchor: [21, 40],
})

function numericCoordinates() {
  if (!props.latitude.trim() || !props.longitude.trim()) return null
  const latitude = Number(props.latitude)
  const longitude = Number(props.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return L.latLng(latitude, longitude)
}

function emitCoordinates(position: L.LatLng) {
  emit('update:latitude', position.lat.toFixed(6))
  emit('update:longitude', position.lng.toFixed(6))
}

function refreshSiteLayers() {
  if (!map) return
  const position = numericCoordinates()

  if (!position) {
    marker?.remove()
    radiusCircle?.remove()
    marker = null
    radiusCircle = null
    return
  }

  if (!marker) {
    marker = L.marker(position, {
      draggable: true,
      autoPan: true,
      icon: siteIcon,
      title: 'Position du site',
      alt: 'Marqueur de la position du site',
    }).addTo(map)
    marker.on('dragend', () => {
      if (marker) emitCoordinates(marker.getLatLng())
    })
  } else {
    marker.setLatLng(position)
  }

  if (!radiusCircle) {
    radiusCircle = L.circle(position, {
      radius: props.radiusM || 100,
      color: '#d80f16',
      fillColor: '#d80f16',
      fillOpacity: 0.12,
      weight: 2,
    }).addTo(map)
  } else {
    radiusCircle.setLatLng(position)
    radiusCircle.setRadius(props.radiusM || 100)
  }
}

function selectPosition(position: L.LatLng, center = false) {
  emitCoordinates(position)
  if (center) map?.setView(position, SELECTED_ZOOM)
}

async function search() {
  locationError.value = null
  await geocodingStore.search(searchQuery.value)
}

function selectResult(result: GeocodingResult) {
  const position = L.latLng(result.latitude, result.longitude)
  searchQuery.value = result.displayName
  emit('update:address', result.displayName)
  geocodingStore.clearResults()
  selectPosition(position, true)
}

function useCurrentLocation() {
  locationError.value = null
  if (!navigator.geolocation) {
    locationError.value = 'La géolocalisation n’est pas disponible sur cet appareil.'
    return
  }

  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      selectPosition(L.latLng(coords.latitude, coords.longitude), true)
      isLocating.value = false
    },
    () => {
      locationError.value = 'Impossible d’obtenir votre position actuelle.'
      isLocating.value = false
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
  )
}

onMounted(async () => {
  if (!mapElement.value) return

  const initialPosition = numericCoordinates()
  map = L.map(mapElement.value, {
    zoomControl: true,
    keyboard: true,
    tapHold: false,
  }).setView(initialPosition ?? DEFAULT_CENTER, initialPosition ? SELECTED_ZOOM : DEFAULT_ZOOM)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  map.on('click', (event: L.LeafletMouseEvent) => selectPosition(event.latlng))
  refreshSiteLayers()

  await nextTick()
  window.setTimeout(() => map?.invalidateSize(), 0)
})

watch(() => [props.latitude, props.longitude, props.radiusM], refreshSiteLayers)
watch(() => props.address, (address) => {
  if (!searchQuery.value) searchQuery.value = address
})

onBeforeUnmount(() => {
  geocodingStore.clearResults()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 md:grid-cols-[1fr_auto_auto]">
      <v-text-field
        v-model="searchQuery"
        label="Rechercher une adresse ou un lieu"
        prepend-inner-icon="mdi-magnify"
        hide-details
        clearable
        @keydown.enter.prevent="search"
      />
      <v-btn
        color="primary"
        variant="outlined"
        height="48"
        :loading="isSearching"
        prepend-icon="mdi-map-search-outline"
        @click="search"
      >
        Rechercher
      </v-btn>
      <v-btn
        color="secondary"
        variant="outlined"
        height="48"
        :loading="isLocating"
        prepend-icon="mdi-crosshairs-gps"
        @click="useCurrentLocation"
      >
        Ma position
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage || locationError"
      type="warning"
      variant="tonal"
      density="compact"
      :text="errorMessage || locationError || ''"
    />

    <v-card v-if="results.length" variant="outlined" rounded="lg">
      <v-list lines="two" density="compact">
        <v-list-item
          v-for="result in results"
          :key="result.id"
          prepend-icon="mdi-map-marker-outline"
          :title="result.displayName"
          subtitle="Afficher ce lieu sur la carte"
          @click="selectResult(result)"
        />
      </v-list>
    </v-card>

    <div class="overflow-hidden rounded-xl border border-[#d9dce2] bg-[#eef1f4]">
      <div
        ref="mapElement"
        class="site-map h-[420px] w-full"
        role="application"
        aria-label="Carte de sélection de la position du site"
        tabindex="0"
      />
    </div>

    <div class="flex flex-col gap-2 text-xs text-[#747985] sm:flex-row sm:items-center sm:justify-between">
      <p><v-icon icon="mdi-gesture-tap" size="18" class="mr-1" />Touchez la carte ou déplacez le marqueur pour ajuster la position.</p>
      <p v-if="latitude && longitude" class="font-medium text-[#535865]">{{ latitude }}, {{ longitude }}</p>
    </div>
  </div>
</template>

<style scoped>
.site-map {
  z-index: 0;
}

:deep(.site-map-marker) {
  background: transparent;
  border: 0;
}

:deep(.site-map-marker .mdi) {
  color: #d80f16;
  font-size: 42px;
  line-height: 42px;
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 25%));
}
</style>
