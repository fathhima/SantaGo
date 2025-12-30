"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Route, Clock, MapPin, Gift, Sparkles } from "lucide-react"
import type { RouteStats } from "@/lib/types"

interface StatsDashboardProps {
  stats: RouteStats
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const progress = stats.totalStops > 0 ? (stats.deliveredCount / stats.totalStops) * 100 : 0

  const formatDistance = (km: number) => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}k km`
    }
    return `${km.toFixed(1)} km`
  }

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return `${hours}h ${mins}m`
    }
    return `${Math.round(minutes)} min`
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-christmas-gold" />
          Santa Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Route className="h-4 w-4" />
              <span className="text-xs uppercase">Distance</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatDistance(stats.totalDistance)}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs uppercase">Est. Time</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatTime(stats.estimatedTime)}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase">Stops</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalStops}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs uppercase">Delivered</span>
            </div>
            <p className="text-xl font-bold text-christmas-green">{stats.deliveredCount}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery Progress</span>
            <span className="text-foreground font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </div>

        {stats.totalStops > 0 && (
          <div className="p-3 rounded-lg bg-christmas-red/10 border border-christmas-red/20">
            <p className="text-sm text-foreground">
              <span className="font-medium">Magic Efficiency:</span>{" "}
              {stats.totalDistance > 0
                ? `${(stats.totalStops / (stats.totalDistance / 100)).toFixed(1)} deliveries per 100km`
                : "N/A"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
