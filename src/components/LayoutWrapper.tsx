'use client'

import { usePathname } from 'next/navigation'

const FULLSCREEN_ROUTES = ['/explore']

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = FULLSCREEN_ROUTES.includes(pathname)

  if (isFullscreen) {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen pb-24 max-w-lg mx-auto">{children}</main>
  )
}
