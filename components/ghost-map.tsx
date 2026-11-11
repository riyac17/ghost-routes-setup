'use client'

import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { latLngBounds, type Map as LeafletMap } from 'leaflet'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { BookingSheet } from '@/components/booking-sheet'
import { RouteLayer } from '@/components/route-layer'
import { RouteSheet } from '@/components/route-sheet'
import { SearchBar, type SearchResult } from '@/components/search-bar'
import { applyRouteReport, type GhostRoute, type RouteReportKind, type RouteReportResult, type VehicleFilter } from '@/lib/routes'

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946]
const FIT_PADDING: [number, number] = [40, 40]

function routeBounds(route: GhostRoute) {
  return latLngBounds([
    ...route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
    ...route.stops.map((stop) => [stop.lat, stop.lon] as [number, number]),
  ])
}

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

// Hand the Leaflet instance up so the search bar can move the view.
function MapInstance({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

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

export default function GhostMap({ routes, signedIn }: { routes: GhostRoute[]; signedIn: boolean }) {
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [bookingRouteId, setBookingRouteId] = useState<string | null>(null)
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all')
  // Local copy of the data so community reports update the map without a reload.
  const [routeData, setRouteData] = useState<GhostRoute[]>(routes)
  const tileTheme = resolvedTheme === 'light' ? 'light' : 'dark'
  const selectedRoute = routeData.find((route) => route.id === selectedRouteId) ?? null

  const visibleRoutes = useMemo(
    () =>
      vehicleFilter === 'all'
        ? routeData
        : routeData.filter((route) => route.vehicleType === vehicleFilter),
    [routeData, vehicleFilter],
  )

  // Hiding a route should not leave its sheet open over a map where it is gone.
  useEffect(() => {
    if (!selectedRouteId) return
    if (!visibleRoutes.some((route) => route.id === selectedRouteId)) setSelectedRouteId(null)
  }, [selectedRouteId, visibleRoutes])

  // A shared link (?route=ID) opens that route and frames it once the map exists.
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (!map || deepLinkHandled.current) return
    deepLinkHandled.current = true

    const routeId = new URLSearchParams(window.location.search).get('route')
    if (!routeId) return

    const route = routeData.find((entry) => entry.id === routeId)
    if (!route) return

    setSelectedRouteId(route.id)
    const bounds = routeBounds(route)
    if (bounds.isValid()) map.fitBounds(bounds, { padding: FIT_PADDING, animate: false })

    // Returning from sign-in lands here with the booking form already open.
    const wantsBooking = new URLSearchParams(window.location.search).get('book') === '1'
    if (wantsBooking && signedIn) setBookingRouteId(route.id)
  }, [map, routeData, signedIn])

  const totalSightings = routeData.reduce((sum, route) => sum + route.sightingsThisWeek, 0)
  const bookingRoute = routeData.find((route) => route.id === bookingRouteId) ?? null

  const closeSheet = useCallback(() => {
    setSelectedRouteId(null)
    setBookingRouteId(null)
  }, [])

  // A stop zooms in on the stop itself; a route fits its whole line and stops.
  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      setSelectedRouteId(result.route.id)
      if (!map) return

      if (result.kind === 'stop') {
        map.flyTo([result.stop.lat, result.stop.lon], Math.max(map.getZoom(), 15), {
          duration: 0.6,
        })
        return
      }

      const bounds = routeBounds(result.route)
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: FIT_PADDING, duration: 0.6 })
      }
    },
    [map],
  )

  // Seat requests need an account; everything else stays public.
  const handleRequestSeat = useCallback(() => {
    if (!selectedRoute) return

    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/?route=${selectedRoute.id}&book=1`)}`)
      return
    }

    setBookingRouteId(selectedRoute.id)
  }, [router, selectedRoute, signedIn])

  const handleReport = useCallback(
    async (routeId: string, kind: RouteReportKind): Promise<RouteReportResult | null> => {
      const current = routeData.find((route) => route.id === routeId)
      if (!current) return null

      const result = await applyRouteReport(current, kind)
      setRouteData((prev) =>
        prev.map((route) =>
          route.id === result.id
            ? {
                ...route,
                confidence: result.confidence,
                sightingsThisWeek: result.sightingsThisWeek,
              }
            : route,
        ),
      )

      return result
    },
    [routeData],
  )

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
        <MapInstance onReady={setMap} />
        <FitRoutes routes={routes} />
        <TileLayer
          key={tileTheme}
          url={TILE_URLS[tileTheme]}
          attribution={ATTRIBUTION}
          maxZoom={16}
        />
        <RouteLayer
          routes={visibleRoutes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
        <MapClickClose onClose={closeSheet} />
      </MapContainer>

      <SearchBar
        routes={visibleRoutes}
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={setVehicleFilter}
        onSelect={handleSearchSelect}
      />

      <p className="pointer-events-none absolute bottom-3 left-3 z-[900] rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-muted-text">
        {routes.length} ghost routes · {totalSightings} sightings this week
      </p>

      {selectedRoute && (
        <RouteSheet
          route={selectedRoute}
          onClose={closeSheet}
          onReport={handleReport}
          onRequestSeat={handleRequestSeat}
        />
      )}

      {bookingRoute && <BookingSheet route={bookingRoute} onClose={() => setBookingRouteId(null)} />}
    </div>
  )
}
