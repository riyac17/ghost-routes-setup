'use client'

import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useState } from 'react'
import { latLngBounds } from 'leaflet'
import { useTheme } from 'next-themes'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { RouteLayer } from '@/components/route-layer'
import { RouteSheet } from '@/components/route-sheet'
import type { GhostRoute } from '@/lib/routes'

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946]
const FIT_PADDING: [number, number] = [40, 40]

// Keyless, theme-matched basemaps from Esri's Canvas service. CARTO's raster
// tiles now require an API key and answer keyless requests with an
// "API KEY REQUIRED" placeholder tile, so these need no key at all.
const TILE_URLS = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light:
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
} as const

const ATTRIBUTION = '© OpenStreetMap contributors © Esri, HERE, Garmin, USGS'

// Drop Leaflet's default "Leaflet |" prefix so the visible credit is exactly
// the map data attribution.
function AttributionPrefix() {
  const map = useMap()

  useEffect(() => {
    map.attributionControl?.setPrefix(false)
  }, [map])

  return null
}

// Fit the view to every route on load, padded around the outermost points.
// Leaflet clamps the resulting zoom to the map's minZoom.
function FitRoutes({ routes }: { routes: GhostRoute[] }) {
  const map = useMap()

  useEffect(() => {
    const points = routes.flatMap((route) => [
      ...route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
      ...route.stops.map((stop) => [stop.lat, stop.lon] as [number, number]),
    ])

    if (points.length === 0) return

    const bounds = latLngBounds(points)
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: FIT_PADDING, animate: false })
    }
  }, [map, routes])

  return null
}

// Clicking the map (but not a route line, which stops bubbling) closes the
// detail sheet.
function MapClickClose({ onClose }: { onClose: () => void }) {
  const map = useMap()

  useEffect(() => {
    map.on('click', onClose)
    return () => {
      map.off('click', onClose)
    }
  }, [map, onClose])

  return null
}

export default function GhostMap({ routes }: { routes: GhostRoute[] }) {
  const { resolvedTheme } = useTheme()
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const tileTheme = resolvedTheme === 'light' ? 'light' : 'dark'
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null

  const closeSheet = useCallback(() => setSelectedRouteId(null), [])

  return (
    <div className="relative size-full">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={12}
        minZoom={5}
        zoomControl={false}
        className="ghost-map size-full bg-bg"
      >
        <AttributionPrefix />
        <FitRoutes routes={routes} />
        <TileLayer
          key={tileTheme}
          url={TILE_URLS[tileTheme]}
          attribution={ATTRIBUTION}
          maxZoom={16}
        />
        <RouteLayer
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
        <MapClickClose onClose={closeSheet} />
      </MapContainer>

      {selectedRoute && <RouteSheet route={selectedRoute} onClose={closeSheet} />}
    </div>
  )
}
