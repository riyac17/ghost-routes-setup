'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTheme } from 'next-themes'
import { RouteLayer } from '@/components/route-layer'
import type { GhostRoute } from '@/lib/routes'

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946]

// CARTO basemaps now return an "API KEY REQUIRED" placeholder tile, so we use
// Esri's keyless Canvas basemaps, which also ship matching dark and light styles.
const TILE_URLS = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
} as const

const ATTRIBUTION =
  '&copy; OpenStreetMap contributors &copy; Esri, HERE, Garmin, USGS'

export default function GhostMap({ routes }: { routes: GhostRoute[] }) {
  const { resolvedTheme } = useTheme()
  const tileTheme = resolvedTheme === 'light' ? 'light' : 'dark'

  return (
    <MapContainer
      center={BENGALURU_CENTER}
      zoom={12}
      minZoom={5}
      zoomControl={false}
      className="ghost-map size-full bg-bg"
    >
      <TileLayer
        key={tileTheme}
        url={TILE_URLS[tileTheme]}
        attribution={ATTRIBUTION}
        maxZoom={16}
      />
      <RouteLayer routes={routes} />
    </MapContainer>
  )
}
