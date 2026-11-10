import { MapLoader } from '@/components/map-loader'
import { ThemeToggle } from '@/components/theme-toggle'
import { getRoutes } from '@/lib/routes'

export default function Page() {
  const routes = getRoutes()

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg">
      <div className="fixed inset-0 z-0">
        <MapLoader routes={routes} />
      </div>

      <div className="fixed right-4 top-4 z-[1100] md:right-6 md:top-6">
        <ThemeToggle />
      </div>
    </main>
  )
}
