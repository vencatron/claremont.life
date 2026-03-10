'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, UtensilsCrossed, Home, Tag, Grid3X3, Compass } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Compass },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Eat', href: '/eat', icon: UtensilsCrossed },
  { label: 'Live', href: '/housing', icon: Home },
  { label: 'Deals', href: '/deals', icon: Tag },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : (pathname === item.href || pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
              {isActive && <div className="w-4 h-0.5 bg-primary rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
