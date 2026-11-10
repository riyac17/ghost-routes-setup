import mockRoutes from '@/data/mock-routes.json'

export type RouteStop = {
  id: string
  name: string
  lat: number
  lon: number
  sightings: number
}

export type RouteFrequency = {
  hour: number
  headway_min: number
}

export type GhostRoute = {
  id: string
  name: string
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  stops: RouteStop[]
  frequency: RouteFrequency[]
  confidence: number
  sightingsThisWeek: number
}

export type RouteTier = 'solid' | 'flicker' | 'whisper'

export function getRouteTier(confidence: number): RouteTier {
  if (confidence > 0.7) return 'solid'
  if (confidence >= 0.4) return 'flicker'
  return 'whisper'
}

export function getRoutes(): GhostRoute[] {
  return mockRoutes as GhostRoute[]
}
