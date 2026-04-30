import Link from 'next/link'
import {
  BadgePercent,
  CalendarDays,
  CalendarRange,
  Clock,
  Moon,
  Pizza,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { HOME_QUICK_ACTIONS } from '@/lib/homepage-daily'
import type { HomeQuickActionId } from '@/lib/homepage-daily'

const ACTION_ICONS: Record<HomeQuickActionId, LucideIcon> = {
  today: CalendarDays,
  tonight: Moon,
  weekend: CalendarRange,
  'free-food': Pizza,
  'open-late': Clock,
  'student-deals': BadgePercent,
  'new-here': Sparkles,
}

const ACTION_STYLES: Record<HomeQuickActionId, string> = {
  today: 'border-sky-300/35 bg-sky-400/15 text-sky-50 md:border-sky-200 md:bg-sky-50 md:text-sky-800',
  tonight: 'border-indigo-300/35 bg-indigo-400/15 text-indigo-50 md:border-indigo-200 md:bg-indigo-50 md:text-indigo-800',
  weekend: 'border-violet-300/35 bg-violet-400/15 text-violet-50 md:border-violet-200 md:bg-violet-50 md:text-violet-800',
  'free-food': 'border-orange-300/35 bg-orange-400/15 text-orange-50 md:border-orange-200 md:bg-orange-50 md:text-orange-800',
  'open-late': 'border-amber-300/35 bg-amber-400/15 text-amber-50 md:border-amber-200 md:bg-amber-50 md:text-amber-800',
  'student-deals': 'border-emerald-300/35 bg-emerald-400/15 text-emerald-50 md:border-emerald-200 md:bg-emerald-50 md:text-emerald-800',
  'new-here': 'border-rose-300/35 bg-rose-400/15 text-rose-50 md:border-rose-200 md:bg-rose-50 md:text-rose-800',
}

export function StudentQuickActions() {
  return (
    <section aria-labelledby="student-quick-actions-title" className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55 md:text-muted-foreground">
          Start here
        </p>
        <h2
          id="student-quick-actions-title"
          className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-foreground"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          What do you need right now?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
        {HOME_QUICK_ACTIONS.map((action) => {
          const Icon = ACTION_ICONS[action.id]

          return (
            <Link
              key={action.id}
              href={action.href}
              className={`group rounded-2xl border p-3 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${ACTION_STYLES[action.id]}`}
            >
              <div className="flex items-start gap-2 md:flex-col md:gap-3">
                <span className="rounded-full bg-white/15 p-2 md:bg-white/70">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-tight">{action.label}</span>
                  <span className="mt-1 hidden text-xs leading-snug opacity-75 md:block">
                    {action.description}
                  </span>
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
