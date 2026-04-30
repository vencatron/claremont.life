'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Events', href: '/events' },
  { label: 'Eat & Drink', href: '/eat' },
  { label: 'Map', href: '/explore' },
  { label: 'Live', href: '/housing' },
  { label: 'Pulse', href: '/know' },
  { label: 'Deals', href: '/deals' },
]

export function DesktopNav() {
  const pathname = usePathname()

  // Hide on fullscreen pages
  if (pathname === '/explore') return null

  return (
    <nav className="sticky top-0 z-50 hidden border-b border-white/60 bg-background/78 backdrop-blur-2xl md:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-[1.05rem] font-semibold tracking-[-0.04em] text-foreground transition-colors hover:text-primary"
        >
          claremont.life
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-white/55 p-1 shadow-sm backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-[0.82rem] font-semibold tracking-[-0.01em] transition-all ${
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
