import { MapLoader } from '@/components/map-loader'
import { ThemeToggle } from '@/components/theme-toggle'
import { getRoutes } from '@/lib/routes'

export default function Page() {
  const routes = getRoutes()

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-text">
      <div className="fixed inset-0 z-0">
        <MapLoader routes={routes} />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center md:top-6">
        <h1 className="pointer-events-auto rounded-full border border-line bg-surface px-4 py-2 font-sans text-sm font-medium tracking-tight">
          Ghost Routes
        </h1>
      </header>

      <div className="fixed right-4 top-4 z-[1000] md:right-6 md:top-6">
        <ThemeToggle />
      </div>
    </main>
  )
}
