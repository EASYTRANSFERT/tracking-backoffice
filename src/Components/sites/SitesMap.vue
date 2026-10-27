<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as L from 'leaflet'

import type { Site, SiteStatus } from '@/types/administrator'

const props = defineProps<{
  sites: Site[]
  supervisorName: (site: Site) => string
}>()

const emit = defineEmits<{ view: [site: Site] }>()

const mapElement = ref<HTMLElement | null>(null)
const locatedSites = computed(() => props.sites.filter(hasValidCoordinates))
const missingLocationCount = computed(() => props.sites.length - locatedSites.value.length)

let map: L.Map | null = null
let sitesLayer: L.FeatureGroup | null = null

const statusColors: Record<SiteStatus, string> = {
  active: '#2e7d4f',
  draft: '#a76000',
  inactive: '#848484',
}

const statusMarkerClasses: Record<SiteStatus, string> = {
  active: 'text-[#2e7d4f]',
  draft: 'text-[#a76000]',
  inactive: 'text-[#848484]',
}

function hasValidCoordinates(site: Site) {
  if (!site.latitude?.trim() || !site.longitude?.trim()) return false
  const latitude = Number(site.latitude)
  const longitude = Number(site.longitude)
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function createPopup(site: Site) {
  const content = document.createElement('div')
  content.className = 'min-w-[210px] font-sans'

  const title = document.createElement('strong')
  title.className = 'text-sm text-[#292d38]'
  title.textContent = site.name
  content.append(title)

  const location = document.createElement('p')
  location.className = 'mt-1.5 text-[11px] text-[#747985]'
  location.textContent =
    [site.city, site.address].filter(Boolean).join(' · ') || 'Adresse à compléter'
  content.append(location)

  const details = document.createElement('p')
  details.className = 'mt-1.5 text-[11px] text-[#747985]'
  details.textContent = `${props.supervisorName(site)} · ${site.radiusM ?? 100} m`
  content.append(details)

  const button = document.createElement('button')
  button.type = 'button'
  button.className =
    'mt-3 cursor-pointer border-0 bg-transparent p-0 font-sans text-xs font-semibold text-[#d80f16]'
  button.textContent = 'Voir le site'
  button.addEventListener('click', () => emit('view', site))
  content.append(button)

  return content
}

function renderSites() {
  if (!map) return
  sitesLayer?.remove()
  sitesLayer = L.featureGroup().addTo(map)

  locatedSites.value.forEach((site) => {
    const position = L.latLng(Number(site.latitude), Number(site.longitude))
    const color = statusColors[site.status]
    const icon = L.divIcon({
      className: '!border-0 !bg-transparent',
      html: `<span class="mdi mdi-map-marker ${statusMarkerClasses[site.status]} text-[38px] leading-[38px] drop-shadow-[0_2px_2px_rgb(0_0_0_/_25%)]"></span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 36],
    })

    const circle = L.circle(position, {
      radius: site.radiusM ?? 100,
      color,
      fillColor: color,
      fillOpacity: 0.1,
      weight: 2,
    })
    const marker = L.marker(position, {
      icon,
      title: site.name,
      alt: `Site ${site.name}`,
    }).bindPopup(createPopup(site))

    sitesLayer?.addLayer(circle)
    sitesLayer?.addLayer(marker)
  })

  if (!locatedSites.value.length) return
  if (locatedSites.value.length === 1) {
    const site = locatedSites.value[0]
    if (!site) return
    map.setView([Number(site.latitude), Number(site.longitude)], 16)
  } else {
    map.fitBounds(sitesLayer.getBounds(), { padding: [36, 36], maxZoom: 16 })
  }
}

onMounted(async () => {
  if (!mapElement.value) return
  map = L.map(mapElement.value, { keyboard: true }).setView([5.3484, -4.0305], 11)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)
  renderSites()
  await nextTick()
  window.setTimeout(() => map?.invalidateSize(), 0)
})

watch(() => props.sites, renderSites, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative">
    <div
      ref="mapElement"
      class="z-0 h-[560px] w-full"
      role="application"
      aria-label="Carte des sites de l’entreprise"
      tabindex="0"
    />
    <v-alert
      v-if="!locatedSites.length"
      class="absolute left-1/2 top-1/2 z-[500] w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2"
      type="info"
      variant="elevated"
      title="Aucun site géolocalisé"
      text="Ajoutez des coordonnées GPS pour afficher les sites sur la carte."
    />
    <div
      v-else-if="missingLocationCount"
      class="absolute left-4 bottom-4 z-[500]"
    >
      <v-chip
      color="warning"
      variant="elevated"
      prepend-icon="mdi-map-marker-alert-outline"
    >
      {{ missingLocationCount }} site{{ missingLocationCount > 1 ? 's' : '' }} sans position
    </v-chip>
  </div>
  </div>
</template>
