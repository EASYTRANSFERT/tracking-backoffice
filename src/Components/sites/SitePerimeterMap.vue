<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as L from 'leaflet'

import { addTileLayer, DEFAULT_CENTER, DEFAULT_ZOOM, perimeterLayer, POINT_ZOOM, pointIcon, toLatLng } from '@/Components/sites/site-map'
import type { SitePoint } from '@/types/administrator'

const props = defineProps<{ points: (SitePoint | null)[] }>()
const emit = defineEmits<{ select: [index: number] }>()

const mapElement = ref<HTMLElement | null>(null)
const hasPoints = computed(() => props.points.some(Boolean))

let map: L.Map | null = null
let layers: L.LayerGroup | null = null

function refreshLayers() {
  if (!map) return
  layers?.clearLayers()
  layers ??= L.layerGroup().addTo(map)

  const positions: L.LatLng[] = []
  props.points.forEach((point, index) => {
    if (!point) return
    const position = toLatLng(point)
    positions.push(position)
    const marker = L.marker(position, { icon: pointIcon(index + 1, true), title: `Point ${index + 1}` })
    marker.on('click', () => emit('select', index))
    layers?.addLayer(marker)
  })

  const perimeter = perimeterLayer(positions)
  if (perimeter) layers.addLayer(perimeter)

  if (positions.length === 1) map.setView(positions[0]!, POINT_ZOOM)
  else if (positions.length > 1) map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] })
  else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
}

onMounted(async () => {
  if (!mapElement.value) return
  map = L.map(mapElement.value, { zoomControl: true, scrollWheelZoom: false })
  addTileLayer(map)
  refreshLayers()
  await nextTick()
  window.setTimeout(() => map?.invalidateSize(), 0)
})

watch(() => props.points, refreshLayers, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layers = null
})
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border border-[#d9dce2] bg-[#eef1f4]">
    <div
      ref="mapElement"
      class="z-0 h-[320px] w-full"
      role="img"
      aria-label="Aperçu du périmètre de pointage du site"
    />
    <div
      v-if="!hasPoints"
      class="pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-white/60 px-6 text-center"
    >
      <p class="flex items-center gap-2 text-sm font-medium text-[#535865]">
        <v-icon icon="mdi-vector-triangle" size="20" />Les points ajoutés apparaîtront ici.
      </p>
    </div>
  </div>
</template>
