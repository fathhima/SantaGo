import type { Location, OptimizedRoute, RouteStats } from "./types"

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Nearest neighbor algorithm for TSP approximation
function nearestNeighborTSP(locations: Location[]): Location[] {
  if (locations.length <= 1) return locations

  const unvisited = [...locations]
  const route: Location[] = []

  // Start with the first location (North Pole / starting point)
  let current = unvisited.shift()!
  route.push(current)

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < unvisited.length; i++) {
      const distance = haversineDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0]
    route.push(current)
  }

  return route
}

// 2-opt improvement for better routes
function twoOptImprove(route: Location[]): Location[] {
  if (route.length < 4) return route

  let improved = true
  let bestRoute = [...route]

  while (improved) {
    improved = false
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const currentDist =
          haversineDistance(bestRoute[i - 1].lat, bestRoute[i - 1].lng, bestRoute[i].lat, bestRoute[i].lng) +
          haversineDistance(bestRoute[j].lat, bestRoute[j].lng, bestRoute[j + 1].lat, bestRoute[j + 1].lng)

        const newDist =
          haversineDistance(bestRoute[i - 1].lat, bestRoute[i - 1].lng, bestRoute[j].lat, bestRoute[j].lng) +
          haversineDistance(bestRoute[i].lat, bestRoute[i].lng, bestRoute[j + 1].lat, bestRoute[j + 1].lng)

        if (newDist < currentDist) {
          // Reverse the segment between i and j
          const newRoute = [...bestRoute.slice(0, i), ...bestRoute.slice(i, j + 1).reverse(), ...bestRoute.slice(j + 1)]
          bestRoute = newRoute
          improved = true
        }
      }
    }
  }

  return bestRoute
}

// Calculate total route distance
function calculateTotalDistance(route: Location[]): number {
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineDistance(route[i].lat, route[i].lng, route[i + 1].lat, route[i + 1].lng)
  }
  return total
}

// Main optimization function
export function optimizeRoute(locations: Location[]): OptimizedRoute {
  if (locations.length === 0) {
    return {
      locations: [],
      stats: { totalDistance: 0, estimatedTime: 0, totalStops: 0, deliveredCount: 0 },
    }
  }

  // Apply nearest neighbor + 2-opt optimization
  let optimizedLocations = nearestNeighborTSP(locations)
  optimizedLocations = twoOptImprove(optimizedLocations)

  const totalDistance = calculateTotalDistance(optimizedLocations)
  // Santa travels at ~10,000 km/h with magic (accounting for delivery time)
  const estimatedTime = (totalDistance / 10000) * 60 + locations.length * 0.5 // minutes

  const stats: RouteStats = {
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedTime: Math.round(estimatedTime),
    totalStops: locations.length,
    deliveredCount: locations.filter((l) => l.delivered).length,
  }

  // Generate polyline for map
  const polyline: [number, number][] = optimizedLocations.map((loc) => [loc.lat, loc.lng])

  return { locations: optimizedLocations, stats, polyline }
}

// Geocoding function (using a free service)
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "User-Agent": "SantaRouteOptimizer/1.0",
        },
      },
    )
    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

// Parse CSV data
export function parseCSV(csvText: string): Array<{ address: string; childName?: string }> {
  const lines = csvText.trim().split("\n")
  const results: Array<{ address: string; childName?: string }> = []

  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes("address") ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted CSV values
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [line]
    const cleanParts = parts.map((p) => p.replace(/^"|"$/g, "").trim())

    if (cleanParts[0]) {
      results.push({
        address: cleanParts[0],
        childName: cleanParts[1] || undefined,
      })
    }
  }

  return results
}
