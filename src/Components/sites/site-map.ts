import * as L from 'leaflet'

import type { SitePoint } from '@/types/administrator'

export const SITE_POINT_COUNT = 3
export const DEFAULT_CENTER: L.LatLngExpression = [5.3484, -4.0305]
export const DEFAULT_ZOOM = 12
export const POINT_ZOOM = 17

const PRIMARY = '#d80f16'

export function addTileLayer(map: L.Map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)
}

export function pointIcon(label: number, active = false) {
  const colors = active
    ? 'bg-[#d80f16] text-white ring-4 ring-[#d80f16]/25'
    : 'bg-white text-[#d80f16] border-2 border-[#d80f16]'
  return L.divIcon({
    className: '!border-0 !bg-transparent',
    html: `<span class="grid h-7 w-7 place-items-center rounded-full text-xs font-bold shadow-md ${colors}">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export function toLatLng(point: SitePoint) {
  return L.latLng(point.latitude, point.longitude)
}

// Deux points forment un segment, trois points le périmètre fermé.
export function perimeterLayer(positions: L.LatLng[]) {
  const style = { color: PRIMARY, weight: 2, fillColor: PRIMARY, fillOpacity: 0.12 }
  if (positions.length >= 3) return L.polygon(positions, style)
  if (positions.length === 2) return L.polyline(positions, { ...style, dashArray: '6 6' })
  return null
}

export function formatCoordinates(point: SitePoint) {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`
}

// L'API refuse des points alignés : ils doivent délimiter une surface (aire approchée en m², projection locale).
const MIN_SURFACE_M2 = 1

export function delimitsSurface(points: SitePoint[]) {
  if (points.length < 3) return false
  const reference = points[0]!
  const metersPerLongitude = 111_320 * Math.cos((reference.latitude * Math.PI) / 180)
  const projected = points.map((point) => ({
    x: (point.longitude - reference.longitude) * metersPerLongitude,
    y: (point.latitude - reference.latitude) * 110_540,
  }))
  const doubledArea = projected.reduce((sum, point, index) => {
    const next = projected[(index + 1) % projected.length]!
    return sum + point.x * next.y - next.x * point.y
  }, 0)
  return Math.abs(doubledArea) / 2 >= MIN_SURFACE_M2
}
