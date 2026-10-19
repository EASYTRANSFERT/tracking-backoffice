import type { GeocodingResult, GeoPosition, PhotonFeature, PhotonResponse } from '@/types/geocoding'

// Photon (OpenStreetMap) est conçu pour la saisie semi-automatique, contrairement à Nominatim.
const PHOTON_URL = 'https://photon.komoot.io'
const SEARCH_BIAS = { lat: '5.3484', lon: '-4.0305' }

function formatFeature(feature: PhotonFeature): GeocodingResult {
  const { properties, geometry } = feature
  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ')
  const parts = [properties.name, street, properties.locality, properties.district, properties.city, properties.country]
  const displayName = parts
    .filter((part, index): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(', ')
  const [longitude, latitude] = geometry.coordinates

  return {
    id: `${properties.osm_type ?? 'X'}${properties.osm_id ?? `${latitude},${longitude}`}`,
    displayName,
    latitude,
    longitude,
  }
}

async function requestPhoton(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const query = new URLSearchParams({ lang: 'fr', ...params })
  const response = await fetch(`${PHOTON_URL}${path}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error('Le service de recherche cartographique est indisponible.')
  }

  const data = (await response.json()) as PhotonResponse
  return data.features.map(formatFeature)
}

export async function suggestLocations(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const results = await requestPhoton('/api/', { q: query, limit: '6', ...SEARCH_BIAS }, signal)
  return results.filter(
    (result, index) => results.findIndex((item) => item.displayName === result.displayName) === index,
  )
}

export async function reverseGeocode(
  position: GeoPosition,
  signal?: AbortSignal,
): Promise<GeocodingResult | null> {
  const [result] = await requestPhoton(
    '/reverse',
    { lat: String(position.latitude), lon: String(position.longitude), limit: '1' },
    signal,
  )
  return result ?? null
}

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error('Impossible d’obtenir votre position actuelle.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  })
}
