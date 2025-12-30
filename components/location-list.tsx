"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Gift, Check, Star } from "lucide-react"
import type { Location } from "@/lib/types"

interface LocationListProps {
  locations: Location[]
  onRemove: (id: string) => void
  onToggleDelivered: (id: string) => void
  onUpdatePriority: (id: string, priority: Location["priority"]) => void
}

export function LocationList({ locations, onRemove, onToggleDelivered, onUpdatePriority }: LocationListProps) {
  const priorityColors = {
    "extra-nice": "bg-christmas-gold text-background",
    nice: "bg-christmas-green text-primary-foreground",
    naughty: "bg-christmas-red/50 text-foreground",
  }

  const priorityLabels = {
    "extra-nice": "Extra Nice",
    nice: "Nice",
    naughty: "Naughty",
  }

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-christmas-green" />
            Delivery List
          </span>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {locations.length} stops
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No locations added yet</p>
              <p className="text-xs">Add addresses to start planning</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    location.delivered
                      ? "bg-christmas-green/10 border-christmas-green/30"
                      : "bg-secondary/50 border-border hover:border-christmas-red/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                        <Badge
                          className={`text-xs cursor-pointer ${priorityColors[location.priority || "nice"]}`}
                          onClick={() => {
                            const priorities: Location["priority"][] = ["nice", "extra-nice", "naughty"]
                            const currentIndex = priorities.indexOf(location.priority || "nice")
                            const nextPriority = priorities[(currentIndex + 1) % priorities.length]
                            onUpdatePriority(location.id, nextPriority)
                          }}
                        >
                          {location.priority === "extra-nice" && <Star className="h-3 w-3 mr-1" />}
                          {priorityLabels[location.priority || "nice"]}
                        </Badge>
                      </div>
                      {location.childName && (
                        <p className="font-medium text-foreground truncate">{location.childName}</p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">{location.address}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${location.delivered ? "text-christmas-green" : "text-muted-foreground hover:text-christmas-green"}`}
                        onClick={() => onToggleDelivered(location.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-christmas-red"
                        onClick={() => onRemove(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
