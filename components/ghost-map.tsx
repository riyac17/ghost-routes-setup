'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTheme } from 'next-themes'

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946]

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
} as const

const ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO'

export default function GhostMap() {
  const { resolvedTheme } = useTheme()
  const tileTheme = resolvedTheme === 'light' ? 'light' : 'dark'

  return (
    <MapContainer
      center={BENGALURU_CENTER}
      zoom={12}
      zoomControl={false}
      className="ghost-map size-full bg-bg"
    >
      <TileLayer
        key={tileTheme}
        url={TILE_URLS[tileTheme]}
        attribution={ATTRIBUTION}
        subdomains="abcd"
        maxZoom={20}
      />
    </MapContainer>
  )
}
