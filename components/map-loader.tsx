'use client'

import dynamic from 'next/dynamic'

const GhostMap = dynamic(() => import('@/components/ghost-map'), {
  ssr: false,
  loading: () => <div className="size-full bg-bg" aria-hidden="true" />,
})

export function MapLoader() {
  return <GhostMap />
}
