"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, MapPin, Plus, Loader2 } from "lucide-react"
import type { Location } from "@/lib/types"
import { geocodeAddress, parseCSV } from "@/lib/route-optimizer"

interface LocationFormProps {
  onAddLocation: (location: Location) => void
  onAddMultiple: (locations: Location[]) => void
}

export function LocationForm({ onAddLocation, onAddMultiple }: LocationFormProps) {
  const [address, setAddress] = useState("")
  const [childName, setChildName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddLocation = async () => {
    if (!address.trim()) return

    setIsLoading(true)
    const coords = await geocodeAddress(address)
    setIsLoading(false)

    if (coords) {
      const newLocation: Location = {
        id: crypto.randomUUID(),
        address: address.trim(),
        lat: coords.lat,
        lng: coords.lng,
        childName: childName.trim() || undefined,
        priority: "nice",
        delivered: false,
      }
      onAddLocation(newLocation)
      setAddress("")
      setChildName("")
    } else {
      alert("Could not find this address. Please try a more specific address.")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const text = await file.text()
    const parsed = parseCSV(text)

    const locations: Location[] = []
    for (const item of parsed) {
      const coords = await geocodeAddress(item.address)
      if (coords) {
        locations.push({
          id: crypto.randomUUID(),
          address: item.address,
          lat: coords.lat,
          lng: coords.lng,
          childName: item.childName,
          priority: "nice",
          delivered: false,
        })
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500))
    }

    setIsUploading(false)
    if (locations.length > 0) {
      onAddMultiple(locations)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-christmas-red" />
          Add Delivery Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-foreground">
            Address
          </Label>
          <Input
            id="address"
            placeholder="123 Candy Cane Lane, North Pole"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="childName" className="text-foreground">
            Child Name (optional)
          </Label>
          <Input
            id="childName"
            placeholder="Little Timmy"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button
          onClick={handleAddLocation}
          disabled={isLoading || !address.trim()}
          className="w-full bg-christmas-red hover:bg-christmas-red/90 text-primary-foreground"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Add Location
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? "Processing..." : "Upload CSV"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">CSV format: address, child_name</p>
        </div>
      </CardContent>
    </Card>
  )
}
