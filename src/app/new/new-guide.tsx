import Link from 'next/link'
import { BadgePercent, Building2, CalendarDays, ChevronRight, Compass, UtensilsCrossed } from 'lucide-react'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/new'

type TimelineSection = {
  title: string
  kicker: string
  items: string[]
}

const timeline: TimelineSection[] = [
  {
    title: 'First 24 hours',
    kicker: 'Do not optimize. Get oriented.',
    items: [
      'Save your campus safety number and learn the fastest way back to your dorm at night.',
      'Walk from your room to Honnold-Mudd Library, the Village, and one dining hall that is not yours.',
      'Put Claremont Station in your maps app so LA without a car feels possible from day one.',
      'Ask two people where they actually eat when dining halls get old.',
    ],
  },
  {
    title: 'First week',
    kicker: 'Build the map in your head.',
    items: [
      'Walk the full Village once: Yale, Harvard, Indian Hill, the bookstore blocks, and the coffee shops.',
      'Attend one event at a college that is not yours, even if you only stay for 20 minutes.',
      'Find a study spot that is not your bed: Honnold, a campus library, a courtyard, or a quiet cafe.',
      'Learn the grocery triangle: convenient, cheap, and car-dependent are usually three different trips.',
    ],
  },
  {
    title: 'First month',
    kicker: 'Pick routines before routines pick you.',
    items: [
      'Choose one weekly anchor off campus: farmers market, coffee, a run, a bookstore lap, or a cheap meal.',
      'Try transit once before you need it. Take Foothill Transit or Metrolink on a low-stakes day.',
      'Bookmark the student discounts page and ask local businesses if they have a student rate.',
      'Learn the social geography: the 5Cs overlap, but each campus has a different default rhythm.',
    ],
  },
  {
    title: 'First semester',
    kicker: 'Make Claremont bigger than your dorm group.',
    items: [
      'Join one cross-college club, lab, publication, volunteer group, or recurring event.',
      'Have one meal in the Village that becomes your reliable cheap food backup.',
      'Start noticing housing streets and commute distances long before leases become urgent.',
      'Take one full day trip by rail so Claremont feels connected to the region, not isolated from it.',
    ],
  },
]

const twentyThings = [
  'The mountains are not background decoration. Go north and you hit foothills fast.',
  'The Village is your starter city: food, coffee, errands, records, books, and the farmers market.',
  'Honnold-Mudd is the shared academic living room, not just a library.',
  'Cross-registration is real; the best class for you may be at another 5C.',
  'The first good friend may come from a club or event, not your hall.',
  'Ask about student discounts everywhere before paying full price.',
  'Cheap food matters. Have one reliable under-budget meal before finals week.',
  'A bike helps, but a good lock matters just as much.',
  'Metrolink makes downtown LA without a car normal if you plan around the schedule.',
  'Parents and visiting friends will ask where to eat. Keep a short list ready.',
  'Every campus has quiet corners; learn at least one that is not on your home campus.',
  'The Sunday farmers market is a better reset than scrolling in bed.',
  'Campus identity is real, but isolation on one campus is optional.',
  'Go to one speaker, performance, game, show, or dinner you would not have picked at home.',
  'Grad students, staff, locals, and upperclassmen know the practical hacks. Ask them.',
  'The best study spots change by hour: morning cafes, afternoon libraries, evening lounges.',
  'Do not wait until sophomore year to learn where groceries, transit, and urgent errands are.',
  'You can be overwhelmed and still be doing Claremont correctly.',
  'Save useful pages before orientation group chats bury them.',
  'Claremont becomes smaller, friendlier, and more useful every time you cross a boundary.',
]

// dot = informal school color, intentionally outside the section-accent system
const campusNotes = [
  {
    name: 'Pomona',
    dot: 'bg-blue-600',
    note: 'Big liberal-arts center of gravity with lots of shared academic and social overlap.',
  },
  {
    name: 'CMC',
    dot: 'bg-red-800',
    note: 'Policy, economics, speakers, dining-room conversations, and a very intentional social rhythm.',
  },
  {
    name: 'Scripps',
    dot: 'bg-emerald-700',
    note: 'Beautiful courtyards, humanities energy, strong community rituals, and places people underestimate.',
  },
  {
    name: 'Pitzer',
    dot: 'bg-orange-500',
    note: 'Creative, activist, outdoorsy, and close to Scripps in both geography and daily movement.',
  },
  {
    name: 'Harvey Mudd',
    dot: 'bg-amber-400',
    note: 'STEM intensity, collaborative problem sets, distinctive culture, and friends who know things work.',
  },
  {
    name: 'CGU + KGI',
    dot: 'bg-violet-600',
    note: 'Graduate-school orbit: older students, professional programs, and useful perspective beyond undergrad life.',
  },
]

const cheapFood = [
  'Keep one dining-hall fallback, one Village meal, and one grocery meal in rotation.',
  'Coffee plus a pastry is not dinner; find your real cheap food before week three.',
  'Use the Eat guide when parents visit, when friends disagree, or when you need something walkable.',
]

const studySpots = [
  'Honnold-Mudd for shared library energy and the feeling that everyone is working.',
  'Your home-campus library or academic building for short gaps between classes.',
  'A Village cafe for daylight work when you need to feel like a person, not just a student.',
  'Outdoor courtyards when the weather is good and your room has become a trap.',
]

export function NewGuide() {
  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      <section
        id="top"
        aria-labelledby="new-here-heading"
        className="mx-auto max-w-6xl scroll-mt-24 overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 shadow-sm md:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">New Here orientation guide</p>
            <h1
              id="new-here-heading"
              className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              New Here? Start with this.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              The incoming 5C student guide to not feel lost in Claremont. Send this to a first-year, transfer,
              grad student, parent, or roommate group chat &mdash; it is built to be saved, screenshot, and shared
              before orientation week gets noisy.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/new</p>
            <p className="mt-3 hidden text-sm leading-6 text-gray-600 sm:block">
              One clean link for orientation-week handouts, RA bulletin boards, and the admitted-students Discord.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="New Here? Incoming Student Guide"
              text="The incoming 5C student guide to not feel lost in Claremont."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Link
            href="/eat"
            className="group flex flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <UtensilsCrossed className="h-4 w-4 text-amber-700" aria-hidden /> Eat
              </span>
              <ChevronRight className="hidden h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </span>
            <span className="hidden text-xs leading-5 text-gray-600 sm:block">Cheap food, coffee, and low-stress first meals.</span>
          </Link>
          <Link
            href="/deals"
            className="group flex flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <BadgePercent className="h-4 w-4 text-amber-700" aria-hidden /> Deals
              </span>
              <ChevronRight className="hidden h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </span>
            <span className="hidden text-xs leading-5 text-gray-600 sm:block">Student discounts and ways to spend less without feeling broke.</span>
          </Link>
          <Link
            href="/events"
            className="group flex flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <CalendarDays className="h-4 w-4 text-amber-700" aria-hidden /> Events
              </span>
              <ChevronRight className="hidden h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </span>
            <span className="hidden text-xs leading-5 text-gray-600 sm:block">One reason to leave your dorm, one to cross campus.</span>
          </Link>
          <Link
            href="/housing"
            className="group flex flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <Building2 className="h-4 w-4 text-amber-700" aria-hidden /> Housing
              </span>
              <ChevronRight className="hidden h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </span>
            <span className="hidden text-xs leading-5 text-gray-600 sm:block">Learn the off-campus neighborhoods before everyone panics.</span>
          </Link>
          <Link
            href="/explore"
            className="group col-span-2 flex flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4 lg:col-span-1"
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <Compass className="h-4 w-4 text-amber-700" aria-hidden /> Map
              </span>
              <ChevronRight className="hidden h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 sm:block" aria-hidden />
            </span>
            <span className="hidden text-xs leading-5 text-gray-600 sm:block">Campuses, the Village, food, and study spots on one map.</span>
          </Link>
        </div>
      </section>

      <nav aria-label="On this page" className="mx-auto mt-5 max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">On this page</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="#start-here"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            Start here
          </a>
          <a
            href="#twenty-things"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
            20 things
          </a>
          <a
            href="#the-campuses"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            The campuses
          </a>
          <a
            href="#getting-around"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
            Getting around
          </a>
          <a
            href="#food-and-money"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
            Food + money
          </a>
          <a
            href="#share-this"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
            Share this
          </a>
        </div>
      </nav>

      <section id="start-here" aria-labelledby="start-here-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900" aria-hidden>01</span>
          Start here
        </p>
        <h2
          id="start-here-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          First 24 hours, first week, first month, first semester
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">
          The goal is not to master Claremont immediately. The goal is to avoid being clueless about the basics and make
          one confident move at a time.
        </p>

        <div className="mt-5 grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-100 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {timeline.map((step, i) => (
            <article key={step.title} className="p-4 md:p-5">
              <div className="h-1 w-10 rounded-full bg-amber-500" aria-hidden />
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold text-gray-950">{step.title}</h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{step.kicker}</p>
              <ol className="mt-3 space-y-2">
                {step.items.map((item, n) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-5 text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900" aria-hidden>{n + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="twenty-things" aria-labelledby="twenty-things-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-900" aria-hidden>02</span>
          Screenshot this
        </p>
        <h2
          id="twenty-things-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          20 things every incoming 5C student should know
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">
          A compact list for the group chat: practical, low-drama, and useful before you know the acronyms.
        </p>

        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <div className="grid md:grid-cols-2 md:gap-x-10">
            <ol className="divide-y divide-stone-100">
              {twentyThings.slice(0, 10).map((item, index) => (
                <li key={item} className="flex items-start gap-3 py-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-900" aria-hidden>{index + 1}</span>
                  <span className="text-sm leading-6 text-gray-800">{item}</span>
                </li>
              ))}
            </ol>
            <ol className="divide-y divide-stone-100 border-t border-stone-100 md:border-t-0" start={11}>
              {twentyThings.slice(10).map((item, index) => (
                <li key={item} className="flex items-start gap-3 py-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-900" aria-hidden>{index + 11}</span>
                  <span className="text-sm leading-6 text-gray-800">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="the-campuses" aria-labelledby="the-campuses-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900" aria-hidden>03</span>
              Social geography
            </p>
            <h2
              id="the-campuses-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              What each campus is like, without making it your whole personality
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">
              These are shortcuts, not boxes. Use them to cross campus more confidently, not to stereotype people.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {campusNotes.map((campus) => (
                <div key={campus.name} className="rounded-2xl bg-stone-50 p-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${campus.dot}`} aria-hidden />
                    {campus.name}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">{campus.note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Do this early</p>
            <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
              How not to get isolated on one campus
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-200">
              <li>Pick one recurring thing that is not hosted by your own college.</li>
              <li>Invite someone to walk to the Village instead of only meeting in dining halls.</li>
              <li>Use events as low-pressure excuses to see other campuses.</li>
              <li>Learn the map by walking it; the 5Cs feel far apart until they do not.</li>
            </ul>
            <Link href="/events" className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-950">
              Find a cross-campus event
            </Link>
          </article>
        </div>
      </section>

      <section id="getting-around" aria-labelledby="getting-around-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-900" aria-hidden>04</span>
          Transit
        </p>
        <h2
          id="getting-around-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          How to get to LA without a car
        </h2>

        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <p className="max-w-2xl text-sm leading-6 text-gray-700 md:text-base">
            Start with Claremont Station, check Metrolink times before you leave, and plan your return before
            your phone battery becomes the problem.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:mt-0"
          >
            Open the map before you go <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section id="food-and-money" aria-labelledby="food-and-money-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-900" aria-hidden>05</span>
          Food + money
        </p>
        <h2
          id="food-and-money-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Eat cheap, study well
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">
          Cheap food is a system, not a single restaurant. And do not wait until midterms to discover where you can
          actually focus.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-lg font-bold text-gray-950">Best cheap food habits</h3>
            <ul className="mt-3 space-y-2.5">
              {cheapFood.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/eat" className="text-sm font-semibold text-orange-700 underline underline-offset-4 hover:text-orange-900">
                Use the Eat guide
              </Link>
              <Link href="/guides/free-food" className="text-sm font-semibold text-orange-700 underline underline-offset-4 hover:text-orange-900">
                Check the free-food radar
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-lg font-bold text-gray-950">Best study spots strategy</h3>
            <ul className="mt-3 space-y-2.5">
              {studySpots.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-gray-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="share-this" aria-labelledby="share-this-heading" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white" aria-hidden>06</span>
            Fast share copy
          </p>
          <h2 id="share-this-heading" className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this to the roommate group chat
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-200">
            &ldquo;Before orientation week gets noisy: claremont.life/new &mdash; first 24 hours through first semester,
            20 things every incoming 5C student should know, and how to get to LA without a car. Save it,
            screenshot it, send it.&rdquo;
          </p>
          <a href="#top" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-200 underline underline-offset-4 transition hover:text-white">
            Back to top
          </a>
        </article>
      </section>

      <section
        aria-labelledby="next-clicks-heading"
        className="mx-auto mt-10 max-w-6xl rounded-3xl border border-stone-200 bg-stone-100/70 p-5 md:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Next clicks</p>
        <h2
          id="next-clicks-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Turn this guide into a plan
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">
          Five minutes now can save you a month of random guessing.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/deals"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Save money with Deals</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">Student prices before you pay full price.</span>
          </Link>
          <Link
            href="/housing"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Learn Housing geography</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">Neighborhoods and commutes before leases get urgent.</span>
          </Link>
          <Link
            href="/events"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Pick one Event</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">One low-pressure reason to cross campus this week.</span>
          </Link>
          <Link
            href="/eat"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Choose first meals</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">Walkable food for week one and parent visits.</span>
          </Link>
          <Link
            href="/guides/new-student-checklist"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Pack the right stuff</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">What to bring to Claremont, and what to leave home.</span>
          </Link>
          <Link
            href="/guides"
            className="group flex flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:p-4"
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-950">Browse all guides</span>
              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-xs leading-5 text-gray-600">Getting around, cheap eats, free food, parents weekend.</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
