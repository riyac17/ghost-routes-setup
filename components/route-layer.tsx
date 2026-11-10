'use client'

import { CircleMarker, Polyline, Popup, Tooltip } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { getRouteTier, type GhostRoute } from '@/lib/routes'

export function RouteLayer({ routes }: { routes: GhostRoute[] }) {
  return (
    <>
      {routes.map((route) => {
        const tier = getRouteTier(route.confidence)
        const positions = route.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon] as LatLngTuple,
        )

        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{ className: `route-line route-${tier}` }}
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

      {routes.flatMap((route) => {
        const tier = getRouteTier(route.confidence)
        return route.stops.map((stop) => (
          <CircleMarker
            key={`${route.id}-${stop.id}`}
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
