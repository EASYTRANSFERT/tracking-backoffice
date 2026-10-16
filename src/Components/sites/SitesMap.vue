<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as L from 'leaflet'

import type { EnterpriseUser, Site, SiteStatus } from '@/types/administrator'

const props = defineProps<{
  sites: Site[]
  users: EnterpriseUser[]
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

function hasValidCoordinates(site: Site) {
  if (!site.latitude?.trim() || !site.longitude?.trim()) return false
  const latitude = Number(site.latitude)
  const longitude = Number(site.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180
}

function managerName(id?: string) {
  const user = props.users.find((item) => item.id === id)
  return user ? `${user.firstName} ${user.lastName}` : 'Non affecté'
}

function createPopup(site: Site) {
  const content = document.createElement('div')
  content.className = 'site-popup'

  const title = document.createElement('strong')
  title.textContent = site.name
  content.append(title)

  const location = document.createElement('p')
  location.textContent = [site.city, site.address].filter(Boolean).join(' · ') || 'Adresse à compléter'
  content.append(location)

  const details = document.createElement('p')
  details.textContent = `${managerName(site.managerId)} · ${site.radiusM ?? 100} m`
  content.append(details)

  const button = document.createElement('button')
  button.type = 'button'
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
      className: 'site-map-marker',
      html: `<span class="mdi mdi-map-marker" style="color:${color}"></span>`,
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
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      class="sites-map h-[560px] w-full"
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
    <v-chip
      v-else-if="missingLocationCount"
      class="absolute left-4 top-4 z-[500]"
      color="warning"
      variant="elevated"
      prepend-icon="mdi-map-marker-alert-outline"
    >
      {{ missingLocationCount }} site{{ missingLocationCount > 1 ? 's' : '' }} sans position
    </v-chip>
  </div>
</template>

<style scoped>
.sites-map {
  z-index: 0;
}

:deep(.site-map-marker) {
  background: transparent;
  border: 0;
}

:deep(.site-map-marker .mdi) {
  font-size: 38px;
  line-height: 38px;
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 25%));
}

:deep(.site-popup) {
  min-width: 210px;
  font-family: Poppins, sans-serif;
}

:deep(.site-popup strong) {
  color: #292d38;
  font-size: 14px;
}

:deep(.site-popup p) {
  margin: 6px 0 0;
  color: #747985;
  font-size: 11px;
}

:deep(.site-popup button) {
  margin-top: 12px;
  border: 0;
  background: transparent;
  color: #d80f16;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
}
</style>
