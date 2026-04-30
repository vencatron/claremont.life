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
    <nav className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          claremont.life
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
