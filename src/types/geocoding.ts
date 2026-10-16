export interface GeocodingResult {
  id: string
  displayName: string
  latitude: number
  longitude: number
}

export interface NominatimSearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}
