"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { Location } from "@/lib/types"

interface RouteMapProps {
  locations: Location[]
  polyline?: [number, number][]
}

export function RouteMap({ locations, polyline }: RouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null)

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = useCallback(
    (
      lat: number,
      lng: number,
      width: number,
      height: number,
      bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    ) => {
      const padding = 60
      const mapWidth = width - padding * 2
      const mapHeight = height - padding * 2

      const x = padding + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * mapWidth
      const y = padding + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * mapHeight

      // Apply zoom and offset
      const centerX = width / 2
      const centerY = height / 2
      const zoomedX = centerX + (x - centerX) * zoom + offset.x
      const zoomedY = centerY + (y - centerY) * zoom + offset.y

      return { x: zoomedX, y: zoomedY }
    },
    [zoom, offset],
  )

  // Calculate bounds from locations
  const getBounds = useCallback(() => {
    if (locations.length === 0) {
      return { minLat: -60, maxLat: 70, minLng: -170, maxLng: 170 }
    }

    const lats = locations.map((l) => l.lat)
    const lngs = locations.map((l) => l.lng)

    const padding = 0.1
    const latRange = Math.max(...lats) - Math.min(...lats) || 10
    const lngRange = Math.max(...lngs) - Math.min(...lngs) || 10

    return {
      minLat: Math.min(...lats) - latRange * padding,
      maxLat: Math.max(...lats) + latRange * padding,
      minLng: Math.min(...lngs) - lngRange * padding,
      maxLng: Math.max(...lngs) + lngRange * padding,
    }
  }, [locations])

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const width = canvas.width
    const height = canvas.height
    const bounds = getBounds()

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1
    const gridSize = 40 * zoom

    for (let x = (offset.x % gridSize) + gridSize; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = (offset.y % gridSize) + gridSize; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw decorative elements (simplified world outline)
    ctx.fillStyle = "#1e293b"
    ctx.beginPath()
    ctx.ellipse(width / 2 + offset.x, height / 2 + offset.y, 150 * zoom, 100 * zoom, 0, 0, Math.PI * 2)
    ctx.fill()

    if (locations.length === 0) {
      // Draw placeholder text
      ctx.fillStyle = "#64748b"
      ctx.font = "16px system-ui"
      ctx.textAlign = "center"
      ctx.fillText("Add locations to see them on the map", width / 2, height / 2)
      ctx.font = "12px system-ui"
      ctx.fillText("Santa's route will appear here", width / 2, height / 2 + 25)
      return
    }

    // Draw route polyline
    if (polyline && polyline.length > 1) {
      ctx.strokeStyle = "#dc2626"
      ctx.lineWidth = 3
      ctx.setLineDash([10, 5])
      ctx.beginPath()

      polyline.forEach((point, i) => {
        const pos = latLngToCanvas(point[0], point[1], width, height, bounds)
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y)
        } else {
          ctx.lineTo(pos.x, pos.y)
        }
      })

      ctx.stroke()
      ctx.setLineDash([])

      // Draw animated dash effect
      ctx.strokeStyle = "#fbbf24"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 15])
      ctx.lineDashOffset = -((Date.now() / 50) % 20)
      ctx.beginPath()

      polyline.forEach((point, i) => {
        const pos = latLngToCanvas(point[0], point[1], width, height, bounds)
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y)
        } else {
          ctx.lineTo(pos.x, pos.y)
        }
      })

      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw location markers
    locations.forEach((location, index) => {
      const pos = latLngToCanvas(location.lat, location.lng, width, height, bounds)
      const radius = 16 * Math.min(zoom, 1.5)
      const isHovered = hoveredLocation?.id === location.id

      // Marker shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.arc(pos.x + 2, pos.y + 2, radius, 0, Math.PI * 2)
      ctx.fill()

      // Marker background
      let color = "#dc2626" // Default red
      if (location.delivered) {
        color = "#22c55e" // Green for delivered
      } else if (location.priority === "extra-nice") {
        color = "#fbbf24" // Gold for extra nice
      } else if (location.priority === "naughty") {
        color = "#6b7280" // Gray for naughty
      }

      // Glow effect for hovered marker
      if (isHovered) {
        ctx.shadowColor = color
        ctx.shadowBlur = 15
      }

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowBlur = 0

      // Marker border
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Marker number
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${12 * Math.min(zoom, 1.5)}px system-ui`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(String(index + 1), pos.x, pos.y)
    })

    // Draw hovered location tooltip
    if (hoveredLocation) {
      const pos = latLngToCanvas(hoveredLocation.lat, hoveredLocation.lng, width, height, bounds)
      const tooltipWidth = 180
      const tooltipHeight = 50
      let tooltipX = pos.x - tooltipWidth / 2
      let tooltipY = pos.y - 45

      // Keep tooltip in bounds
      tooltipX = Math.max(10, Math.min(width - tooltipWidth - 10, tooltipX))
      tooltipY = Math.max(10, tooltipY)

      // Tooltip background
      ctx.fillStyle = "rgba(30, 41, 59, 0.95)"
      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8)
      ctx.fill()

      ctx.strokeStyle = "#475569"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8)
      ctx.stroke()

      // Tooltip text
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      const name = hoveredLocation.childName || `Stop #${locations.indexOf(hoveredLocation) + 1}`
      ctx.fillText(name.slice(0, 20), tooltipX + 10, tooltipY + 10)

      ctx.fillStyle = "#94a3b8"
      ctx.font = "11px system-ui"
      ctx.fillText(hoveredLocation.address.slice(0, 25), tooltipX + 10, tooltipY + 28)
    }
  }, [locations, polyline, zoom, offset, hoveredLocation, getBounds, latLngToCanvas])

  // Animation loop for dashed line
  useEffect(() => {
    if (!polyline || polyline.length < 2) return

    const interval = setInterval(() => {
      const canvas = canvasRef.current
      if (canvas) {
        // Trigger re-render for animation
        setOffset((prev) => ({ ...prev }))
      }
    }, 50)

    return () => clearInterval(interval)
  }, [polyline])

  // Handle mouse events for dragging and hovering
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    } else {
      // Check for hover
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const bounds = getBounds()

      let found: Location | null = null
      for (const location of locations) {
        const pos = latLngToCanvas(location.lat, location.lng, canvas.width, canvas.height, bounds)
        const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2)
        if (distance < 20) {
          found = location
          break
        }
      }
      setHoveredLocation(found)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredLocation(null)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 5))
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.3, 0.5))
  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Card
      className={`bg-card border-border transition-all duration-300 ${isFullscreen ? "fixed inset-4 z-50" : "h-full"}`}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Map className="h-5 w-5 text-christmas-red" />
          Route Map
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className={`w-full rounded-b-lg overflow-hidden ${isFullscreen ? "h-[calc(100%-60px)]" : "h-[500px] lg:h-[600px]"}`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </CardContent>
    </Card>
  )
}
