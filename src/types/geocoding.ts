export interface GeocodingResult {
  id: string
  displayName: string
  latitude: number
  longitude: number
}

export interface GeoPosition {
  latitude: number
  longitude: number
}

export interface PhotonFeature {
  properties: {
    osm_type?: string
    osm_id?: number
    name?: string
    housenumber?: string
    street?: string
    locality?: string
    district?: string
    city?: string
    state?: string
    country?: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface PhotonResponse {
  features: PhotonFeature[]
}
