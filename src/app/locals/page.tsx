import Link from 'next/link'
import {
  ArrowRight,
  Bus,
  CalendarDays,
  ExternalLink,
  Landmark,
  LibraryBig,
  MapPinned,
  Newspaper,
  ShieldCheck,
  Store,
} from 'lucide-react'

const LOCAL_RESOURCE_GROUPS = [
  {
    title: 'City services',
    description: 'The official starting point for trash and recycling, permits, trees, parks, council meetings, and city departments.',
    icon: Landmark,
    links: [
      { label: 'City of Claremont', href: 'https://www.ci.claremont.ca.us/' },
      { label: 'City calendar', href: 'https://www.ci.claremont.ca.us/' },
      { label: 'Community services', href: 'https://www.ci.claremont.ca.us/' },
    ],
  },
  {
    title: 'Local news + civic pulse',
    description: 'Keep an eye on council decisions, school news, local reporting, and the slower-moving civic stuff that actually changes daily life.',
    icon: Newspaper,
    links: [
      { label: 'Claremont Courier', href: 'https://claremont-courier.com/' },
      { label: 'Know Claremont', href: '/know' },
      { label: 'Submit a community event', href: '/events/submit' },
    ],
  },
  {
    title: 'Family + neighborhood basics',
    description: 'Schools, library services, youth programs, recreation, and the public resources families tend to need repeatedly.',
    icon: LibraryBig,
    links: [
      { label: 'Claremont Unified School District', href: 'https://www.cusd.claremont.edu/' },
      { label: 'Claremont Library', href: 'https://lacountylibrary.org/location/claremont-library/' },
      { label: 'Living well guide', href: '/thrive' },
    ],
  },
  {
    title: 'Getting around town',
    description: 'Metrolink, Foothill Transit, bikes, parking, and the local mobility shortcuts that make Claremont less car-dependent.',
    icon: Bus,
    links: [
      { label: 'Getting Around guide', href: '/move' },
      { label: 'Foothill Transit', href: 'https://www.foothilltransit.org/' },
      { label: 'Claremont Metrolink Station', href: 'https://metrolinktrains.com/rider-info/general-info/stations/claremont/' },
    ],
  },
  {
    title: 'Village + local businesses',
    description: 'A resident-friendly layer for the Village, local shops, restaurants, markets, and places worth keeping alive.',
    icon: Store,
    links: [
      { label: 'Explore the Village map', href: '/explore' },
      { label: 'Claremont Chamber', href: 'https://www.claremontchamber.org/' },
      { label: 'Farmers & Artisans Market', href: 'https://www.claremontforum.org/farmers-artisans-market' },
    ],
  },
  {
    title: 'Safety + practical help',
    description: 'A quick path to official contacts, emergency preparedness, neighborhood concerns, and practical resident errands.',
    icon: ShieldCheck,
    links: [
      { label: 'City contacts', href: 'https://www.ci.claremont.ca.us/' },
      { label: 'Local events', href: '/events' },
      { label: 'Housing + neighborhoods', href: '/housing' },
    ],
  },
]

const RESIDENT_SHORTCUTS = [
  { label: 'City services', value: 'trash, permits, parks, trees' },
  { label: 'Transit', value: 'Metrolink + Foothill Transit' },
  { label: 'Family basics', value: 'schools, library, recreation' },
]

function isExternal(href: string) {
  return href.startsWith('http')
}

export default function LocalsPage() {
  return (
    <div className="aurora-field min-h-screen pb-6">
      <section className="cl-container pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="cl-card relative overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-emerald-400/12 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-end">
            <div>
              <p className="cl-eyebrow">Locals</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-foreground md:text-6xl">
                Useful links for living here, not just visiting.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                A resident layer for Claremont basics: city services, schools, library, transit, local news, the Village, and neighborhood resources.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {RESIDENT_SHORTCUTS.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-white/70 bg-white/62 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cl-container pb-8 md:pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="cl-eyebrow">Resident field guide</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">
              Local information that should be one tap away
            </h2>
          </div>
          <MapPinned className="hidden h-7 w-7 text-muted-foreground md:block" aria-hidden="true" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LOCAL_RESOURCE_GROUPS.map((group) => {
            const Icon = group.icon
            return (
              <article key={group.title} className="cl-card flex min-h-[19rem] flex-col p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CalendarDays className="h-5 w-5 text-muted-foreground/55" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-foreground">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
                <div className="mt-auto pt-5">
                  <div className="space-y-2">
                    {group.links.map((link) => {
                      const external = isExternal(link.href)
                      const className = 'group/link flex min-h-11 items-center justify-between rounded-2xl border border-border/70 bg-background/72 px-3 py-2 text-sm font-semibold tracking-[-0.01em] text-foreground transition-all hover:border-primary/25 hover:bg-white/85'
                      const content = (
                        <>
                          <span>{link.label}</span>
                          {external ? (
                            <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" aria-hidden="true" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
                          )}
                        </>
                      )

                      return external ? (
                        <a key={link.href} href={link.href} className={className} target="_blank" rel="noreferrer">
                          {content}
                        </a>
                      ) : (
                        <Link key={link.href} href={link.href} className={className}>
                          {content}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
