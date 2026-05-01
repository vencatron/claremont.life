import Link from 'next/link'
import {
  BadgePercent,
  CalendarDays,
  CalendarRange,
  Clock,
  Moon,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { HOME_QUICK_ACTIONS } from '@/lib/homepage-daily'
import type { HomeQuickActionId } from '@/lib/homepage-daily'

const ACTION_ICONS: Record<HomeQuickActionId, LucideIcon> = {
  today: CalendarDays,
  tonight: Moon,
  weekend: CalendarRange,
  'open-late': Clock,
  'student-deals': BadgePercent,
  'new-here': Sparkles,
}

const ACTION_STYLES: Record<HomeQuickActionId, string> = {
  today: 'border-sky-200/80 bg-sky-50/75 text-sky-900',
  tonight: 'border-indigo-200/80 bg-indigo-50/75 text-indigo-900',
  weekend: 'border-violet-200/80 bg-violet-50/75 text-violet-900',
  'open-late': 'border-amber-200/80 bg-amber-50/75 text-amber-950',
  'student-deals': 'border-emerald-200/80 bg-emerald-50/75 text-emerald-950',
  'new-here': 'border-rose-200/80 bg-rose-50/75 text-rose-950',
}

export function StudentQuickActions() {
  return (
    <section aria-labelledby="student-quick-actions-title" className="space-y-3">
      <div>
        <p className="cl-eyebrow">Start here</p>
        <h2
          id="student-quick-actions-title"
          className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-foreground md:text-3xl"
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
              className={`group min-h-24 rounded-[1.25rem] border p-3 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.98] ${ACTION_STYLES[action.id]}`}
            >
              <div className="flex items-start gap-2 md:flex-col md:gap-3">
                <span className="rounded-full bg-white/70 p-2 shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-tight tracking-[-0.02em]">{action.label}</span>
                  <span className="mt-1 hidden text-xs leading-snug opacity-72 md:block">
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
