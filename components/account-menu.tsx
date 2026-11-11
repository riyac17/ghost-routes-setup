'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CircleUser, LogOut, Ticket } from 'lucide-react'
import { signOutAction } from '@/app/actions'

export function AccountMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const triggerClass =
    'inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-text transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-solid'

  if (!signedIn) {
    return (
      <Link href="/login" aria-label="Sign in" title="Sign in" className={triggerClass}>
        <CircleUser className="size-4" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
      >
        <CircleUser className="size-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[1300] mt-2 w-44 overflow-hidden rounded-md border border-line bg-surface py-1"
        >
          <Link
            href="/bookings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 font-sans text-sm text-text transition-colors hover:bg-card"
          >
            <Ticket className="size-3.5 text-muted-text" aria-hidden="true" />
            My bookings
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm text-muted-text transition-colors hover:bg-card hover:text-text"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
