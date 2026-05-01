import Link from 'next/link'
import { ArrowUpRight, Circle, MapPin } from 'lucide-react'
import { WavyBackground } from '@/components/ui/wavy-background'

const COLLEGES = ['Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI']

const PILLARS = [
  { label: 'EVENTS', href: '/events' },
  { label: 'EATS', href: '/eat' },
  { label: 'HOUSING', href: '/housing' },
  { label: 'DEALS', href: '/deals' },
]

const HERO_WAVE_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#0f766e', '#f59e0b']

export function ScrollScrubHero() {
  return (
    <section className="relative px-4 pb-12 pt-6 md:px-6 md:pb-24 md:pt-14" aria-label="Claremont Life">
      <div className="mx-auto max-w-6xl">
        <WavyBackground
          containerClassName="relative min-h-[22rem] rounded-[2rem] border border-white/70 bg-[rgb(252,249,241)] shadow-[0_30px_100px_rgba(20,30,50,0.10)] backdrop-blur-2xl md:min-h-[32rem] md:rounded-[2.5rem]"
          className="flex min-h-[22rem] flex-col justify-between p-5 md:min-h-[32rem] md:p-8 lg:p-10"
          canvasClassName="opacity-85 [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]"
          colors={HERO_WAVE_COLORS}
          backgroundFill="rgba(252, 249, 241, 0.76)"
          blur={12}
          speed="fast"
          waveOpacity={0.24}
          waveWidth={30}
          amplitude={54}
        >
          <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,0.14),transparent_30%),radial-gradient(circle_at_74%_22%,rgba(124,58,237,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.28)_42%,rgba(255,255,255,0.76))]" />
            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-foreground/18 to-transparent" />
            <div className="absolute left-8 top-8 h-[calc(100%-4rem)] w-px bg-gradient-to-b from-transparent via-foreground/10 to-transparent md:left-12" />
            <div className="absolute right-8 top-8 h-[calc(100%-4rem)] w-px bg-gradient-to-b from-transparent via-foreground/10 to-transparent md:right-12" />
          </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/72 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur-xl">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Claremont Life
              </div>
              <div className="hidden items-center gap-1 text-xs font-semibold text-muted-foreground md:flex">
                {COLLEGES.map((college, index) => (
                  <span key={college} className="flex items-center gap-1.5">
                    <span>{college}</span>
                    {index < COLLEGES.length - 1 && <Circle className="h-1 w-1 fill-current" aria-hidden="true" />}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
              <div>
                <div className="mb-5 flex items-center gap-3 text-muted-foreground" aria-hidden="true">
                  <span className="h-px w-14 bg-current/45" />
                  <span className="h-3 w-3 rounded-full border border-current/45" />
                  <span className="h-px w-24 bg-current/25" />
                </div>
                <p className="cl-eyebrow">Claremont Life</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[0.9] tracking-[-0.075em] text-foreground min-[380px]:text-5xl md:mt-4 md:text-7xl lg:text-8xl">
                  CLAREMONT LIFE
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                {PILLARS.map((pillar) => (
                  <Link
                    key={pillar.href}
                    href={pillar.href}
                    className="group flex min-h-14 items-center justify-between rounded-2xl border border-white/70 bg-background/70 px-4 py-3 text-sm font-bold tracking-[0.12em] text-foreground shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
                  >
                    <span>{pillar.label}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-45 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 md:hidden">
              {COLLEGES.map((college) => (
                <span key={college} className="rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-[0.68rem] font-semibold text-muted-foreground backdrop-blur-xl">
                  {college}
                </span>
              ))}
            </div>
        </WavyBackground>
      </div>
    </section>
  )
}
