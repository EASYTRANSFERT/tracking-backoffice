import type { GeocodingResult, NominatimSearchResult } from '@/types/geocoding'

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'

export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'fr',
  })

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error('Le service de recherche cartographique est indisponible.')
  }

  const results = (await response.json()) as NominatimSearchResult[]

  return results.map((result) => ({
    id: String(result.place_id),
    displayName: result.display_name,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  }))
}
