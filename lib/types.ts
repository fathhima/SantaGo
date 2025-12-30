export interface Location {
  id: string
  address: string
  lat: number
  lng: number
  childName?: string
  priority?: "nice" | "naughty" | "extra-nice"
  delivered?: boolean
}

export interface RouteStats {
  totalDistance: number
  estimatedTime: number
  totalStops: number
  deliveredCount: number
}

export interface OptimizedRoute {
  locations: Location[]
  stats: RouteStats
  polyline?: [number, number][]
}
