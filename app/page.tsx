"use client"

import { useState, useCallback, useEffect, Suspense, lazy } from "react"
import { LocationForm } from "@/components/location-form"
import { LocationList } from "@/components/location-list"
import { StatsDashboard } from "@/components/stats-dashboard"
import { Snowfall } from "@/components/snowfall"
import { Button } from "@/components/ui/button"
import { Sparkles, RotateCcw } from "lucide-react"
import type { Location, OptimizedRoute } from "@/lib/types"
import { optimizeRoute } from "@/lib/route-optimizer"

const RouteMap = lazy(() => import("@/components/route-map").then((mod) => ({ default: mod.RouteMap })))

// Custom sleigh icon for Lucide compatibility
const SleighIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 19h8a4 4 0 0 0 0-8H6a4 4 0 0 0 0 8h2z" />
    <path d="M10 15V9a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v6" />
    <path d="M14 9h2" />
    <circle cx="7" cy="19" r="2" />
    <circle cx="17" cy="19" r="2" />
  </svg>
)

function MapLoadingFallback() {
  return (
    <div className="h-[500px] lg:h-[600px] bg-card border border-border rounded-lg flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <div className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse rounded-full bg-secondary" />
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  )
}

export default function SantaRouteOptimizer() {
  const [locations, setLocations] = useState<Location[]>([])
  const [optimizedData, setOptimizedData] = useState<OptimizedRoute>({
    locations: [],
    stats: { totalDistance: 0, estimatedTime: 0, totalStops: 0, deliveredCount: 0 },
  })
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Re-calculate stats whenever locations change
  useEffect(() => {
    if (locations.length > 0) {
      const result = optimizeRoute(locations)
      setOptimizedData(result)
    } else {
      setOptimizedData({
        locations: [],
        stats: { totalDistance: 0, estimatedTime: 0, totalStops: 0, deliveredCount: 0 },
      })
    }
  }, [locations])

  const handleAddLocation = useCallback((location: Location) => {
    setLocations((prev) => [...prev, location])
  }, [])

  const handleAddMultiple = useCallback((newLocations: Location[]) => {
    setLocations((prev) => [...prev, ...newLocations])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const handleToggleDelivered = useCallback((id: string) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, delivered: !l.delivered } : l)))
  }, [])

  const handleUpdatePriority = useCallback((id: string, priority: Location["priority"]) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, priority } : l)))
  }, [])

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true)
    setTimeout(() => {
      const result = optimizeRoute(locations)
      setOptimizedData(result)
      setLocations(result.locations)
      setIsOptimizing(false)
    }, 500)
  }, [locations])

  const handleReset = useCallback(() => {
    setLocations([])
    setOptimizedData({
      locations: [],
      stats: { totalDistance: 0, estimatedTime: 0, totalStops: 0, deliveredCount: 0 },
    })
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      <Snowfall />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-christmas-red text-primary-foreground">
                <SleighIcon />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{"Santa's Route Optimizer"}</h1>
                <p className="text-sm text-muted-foreground">Plan the most efficient delivery route</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={locations.length === 0}
                className="border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleOptimize}
                disabled={locations.length < 2 || isOptimizing}
                className="bg-christmas-green hover:bg-christmas-green/90 text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isOptimizing ? "Optimizing..." : "Optimize Route"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Location Management */}
          <div className="lg:col-span-3 space-y-6">
            <LocationForm onAddLocation={handleAddLocation} onAddMultiple={handleAddMultiple} />
            <StatsDashboard stats={optimizedData.stats} />
          </div>

          {/* Center - Map */}
          <div className="lg:col-span-6">
            <Suspense fallback={<MapLoadingFallback />}>
              <RouteMap
                locations={optimizedData.locations.length > 0 ? optimizedData.locations : locations}
                polyline={optimizedData.polyline}
              />
            </Suspense>
          </div>

          {/* Right Sidebar - Delivery List */}
          <div className="lg:col-span-3">
            <LocationList
              locations={optimizedData.locations.length > 0 ? optimizedData.locations : locations}
              onRemove={handleRemove}
              onToggleDelivered={handleToggleDelivered}
              onUpdatePriority={handleUpdatePriority}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Helping Santa deliver joy to children worldwide with optimized routes
          </p>
        </div>
      </footer>
    </div>
  )
}
