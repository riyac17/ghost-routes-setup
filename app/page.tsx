import { ThemeToggle } from '@/components/theme-toggle'

export default function Page() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-bg text-text">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <ThemeToggle />
      </div>
      <h1 className="font-sans text-xl font-medium tracking-tight">Ghost Routes</h1>
    </main>
  )
}
