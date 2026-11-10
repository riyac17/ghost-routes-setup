'use client'

import { X } from 'lucide-react'
import type { GhostRoute, RouteFrequency } from '@/lib/routes'

const SEGMENTS = 5

function statusWording(confidence: number) {
  if (confidence > 0.9) return 'Solid'
  if (confidence > 0.7) return 'Almost solid'
  if (confidence >= 0.4) return 'Flickering'
  return 'Just a whisper'
}

function sortFrequency(frequency: RouteFrequency[]) {
  return [...frequency].sort((a, b) => a.hour - b.hour)
}

// Use the current hour's headway when the route runs now; otherwise fall
// forward to its next operating hour (and wrap to the first one at night).
function nextLikely(frequency: RouteFrequency[]) {
  const hour = new Date().getHours()
  const sorted = sortFrequency(frequency)
  const current = sorted.find((entry) => entry.hour === hour)
  if (current) return current.headway_min
  const upcoming = sorted.find((entry) => entry.hour > hour)
  return (upcoming ?? sorted[0]).headway_min
}

function formatHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24
  return {
    label: normalized % 12 === 0 ? 12 : normalized % 12,
    meridiem: normalized < 12 ? 'am' : 'pm',
  }
}

// The busiest window is the longest consecutive run of hours sharing the
// route's lowest headway (earliest run wins a tie).
function busiestWindow(frequency: RouteFrequency[]) {
  const sorted = sortFrequency(frequency)
  const min = Math.min(...sorted.map((entry) => entry.headway_min))
  const runs: number[][] = []

  for (const entry of sorted) {
    if (entry.headway_min !== min) continue
    const last = runs[runs.length - 1]
    if (last && last[last.length - 1] + 1 === entry.hour) last.push(entry.hour)
    else runs.push([entry.hour])
  }

  const [best] = runs.sort((a, b) => b.length - a.length || a[0] - b[0])
  if (!best) return '—'

  const start = formatHour(best[0])
  const end = formatHour(best[best.length - 1] + 1)

  return start.meridiem === end.meridiem
    ? `${start.label}–${end.label} ${start.meridiem}`
    : `${start.label}${start.meridiem}–${end.label}${end.meridiem}`
}

export function RouteSheet({ route, onClose }: { route: GhostRoute; onClose: () => void }) {
  const filled = Math.round(route.confidence * SEGMENTS)
  const label = route.confidence > 0.9 ? 'solid' : 'materializing'

  return (
    <aside
      aria-label={`${route.name} details`}
      data-route-sheet
      className="absolute inset-x-0 bottom-0 z-[1000] rounded-t-lg border border-line bg-surface md:inset-y-0 md:left-0 md:right-auto md:w-[360px] md:rounded-none md:border-r"
    >
      <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto p-5 pb-6 md:h-full md:max-h-none md:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text">
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close route details"
            className="-mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-text transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-solid"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <h2 className="font-sans text-lg font-medium leading-tight tracking-tight text-text">
          {route.name}
        </h2>

        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index < filled ? 'bg-route-solid' : 'bg-line'}`}
            />
          ))}
        </div>

        <p className="font-sans text-sm text-text">
          {statusWording(route.confidence)}{' '}
          <span className="text-muted-text">· {route.sightingsThisWeek} sightings this week</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-line bg-card p-3">
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text">
              Next likely
            </span>
            <span className="mt-1 block font-sans text-sm text-text">
              about {nextLikely(route.frequency)} min
            </span>
          </div>
          <div className="rounded-md border border-line bg-card p-3">
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-text">
              Busiest
            </span>
            <span className="mt-1 block font-sans text-sm text-text">
              {busiestWindow(route.frequency)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
