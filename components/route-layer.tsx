'use client'

import { Fragment } from 'react'
import { CircleMarker, Polyline, Popup, Tooltip } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { getRouteTier, type GhostRoute } from '@/lib/routes'

const RIPPLE_MIN = 7
const RIPPLE_MAX = 18
const RIPPLE_GAP = 1.55

// Radius grows with the square root of sightings so area reads as the count,
// and the busiest stop still fits around its dot.
function rippleRadius(sightings: number, maxSightings: number) {
  const share = maxSightings > 0 ? Math.min(sightings / maxSightings, 1) : 0
  return RIPPLE_MIN + (RIPPLE_MAX - RIPPLE_MIN) * Math.sqrt(share)
}

export function RouteLayer({
  routes,
  selectedRouteId,
  onSelectRoute,
}: {
  routes: GhostRoute[]
  selectedRouteId: string | null
  onSelectRoute: (id: string) => void
}) {
  const maxSightings = routes.reduce(
    (max, route) => route.stops.reduce((inner, stop) => Math.max(inner, stop.sightings), max),
    0,
  )

  return (
    <>
      {routes.map((route) => {
        const tier = getRouteTier(route.confidence)
        const isSelected = selectedRouteId === route.id
        const positions = route.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon] as LatLngTuple,
        )

        return (
          <Polyline
            // Leaflet only reads `className` when the SVG path is created, so
            // remounting is what applies both the highlight and tier changes.
            key={`${route.id}-${tier}-${isSelected ? 'selected' : 'idle'}`}
            positions={positions}
            pathOptions={{
              className: `route-line route-${tier}${isSelected ? ' route-selected' : ''}`,
              bubblingMouseEvents: false,
            }}
            eventHandlers={{ click: () => onSelectRoute(route.id) }}
          >
            <Tooltip sticky className="route-tooltip">
              <span className="block font-sans text-xs font-medium">{route.name}</span>
              <span className="block font-mono text-[10px] text-muted-text">
                {`${Math.round(route.confidence * 100)}% conf · ${route.sightingsThisWeek} sightings/wk`}
              </span>
            </Tooltip>
          </Polyline>
        )
      })}

      {/* Halo sits under the lines' dots but above nothing else: two concentric
          rings in the solid route colour that slowly pulse outward. */}
      {routes.flatMap((route) =>
        route.stops.map((stop) => {
          const radius = rippleRadius(stop.sightings, maxSightings)

          return (
            <Fragment key={`ripple-${route.id}-${stop.id}`}>
              <CircleMarker
                center={[stop.lat, stop.lon]}
                radius={radius}
                interactive={false}
                pathOptions={{ className: 'route-ripple route-ripple-inner' }}
              />
              <CircleMarker
                center={[stop.lat, stop.lon]}
                radius={radius * RIPPLE_GAP}
                interactive={false}
                pathOptions={{ className: 'route-ripple route-ripple-outer' }}
              />
            </Fragment>
          )
        }),
      )}

      {routes.flatMap((route) => {
        const tier = getRouteTier(route.confidence)
        return route.stops.map((stop) => (
          <CircleMarker
            key={`${route.id}-${tier}-${stop.id}`}
            center={[stop.lat, stop.lon]}
            radius={4}
            pathOptions={{ className: `route-stop route-stop-${tier}` }}
          >
            <Popup className="stop-popup" offset={[0, -2]}>
              <span className="block font-sans text-xs font-medium">{stop.name}</span>
              <span className="block font-mono text-[10px] text-muted-text">
                {`${route.name} · ${stop.sightings} sightings`}
              </span>
            </Popup>
          </CircleMarker>
        ))
      })}
    </>
  )
}
