'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, UtensilsCrossed, Tag, Users, Building2, Compass } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Eat', href: '/eat', icon: UtensilsCrossed },
  { label: 'Map', href: '/explore', icon: Compass },
  { label: 'Live', href: '/housing', icon: Building2 },
  { label: 'Pulse', href: '/know', icon: Users },
  { label: 'Deals', href: '/deals', icon: Tag },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide nav on fullscreen pages
  if (pathname === '/explore') return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-background/82 backdrop-blur-2xl md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto grid h-16 max-w-lg grid-cols-6 px-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : (pathname === item.href || pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[0.68rem] font-semibold transition-all ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className={`rounded-full p-1.5 transition-all ${isActive ? 'bg-foreground text-background shadow-sm' : 'bg-transparent'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
