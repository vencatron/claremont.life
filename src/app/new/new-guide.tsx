import Link from 'next/link'

type TimelineSection = {
  title: string
  kicker: string
  items: string[]
}

type LinkCard = {
  href: string
  label: string
  description: string
}

const quickLinks: LinkCard[] = [
  {
    href: '/eat',
    label: 'Eat',
    description: 'Cheap food, parent-weekend meals, coffee, and low-stress first meals.',
  },
  {
    href: '/deals',
    label: 'Deals',
    description: 'Student discounts and local ways to spend less without feeling broke.',
  },
  {
    href: '/events',
    label: 'Events',
    description: 'Find one reason to leave your dorm and one reason to cross campus.',
  },
  {
    href: '/housing',
    label: 'Housing',
    description: 'Start learning the off-campus neighborhoods before everyone else is panicking.',
  },
  {
    href: '/explore',
    label: 'Map',
    description: 'Use the explore map to connect campuses, the Village, food, and study spots.',
  },
]

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

const campusNotes = [
  {
    name: 'Pomona',
    note: 'Big liberal-arts center of gravity with lots of shared academic and social overlap.',
  },
  {
    name: 'CMC',
    note: 'Policy, economics, speakers, dining-room conversations, and a very intentional social rhythm.',
  },
  {
    name: 'Scripps',
    note: 'Beautiful courtyards, humanities energy, strong community rituals, and places people underestimate.',
  },
  {
    name: 'Pitzer',
    note: 'Creative, activist, outdoorsy, and close to Scripps in both geography and daily movement.',
  },
  {
    name: 'Harvey Mudd',
    note: 'STEM intensity, collaborative problem sets, distinctive culture, and friends who know things work.',
  },
  {
    name: 'CGU + KGI',
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

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
        {title}
      </h2>
      {children && <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">{children}</p>}
    </div>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {index + 1}
          </span>
          <span className="text-sm leading-6 text-gray-700">{item}</span>
        </li>
      ))}
    </ol>
  )
}

export function NewGuide() {
  return (
    <div className="px-4 pb-10 md:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 shadow-sm md:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">New Here orientation guide</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
            New Here? The incoming 5C student guide to not feel lost in Claremont.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
            Send this to a first-year, transfer, grad student, parent, or roommate group chat. It is built to be saved,
            screenshot, and shared before orientation week gets noisy.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-gray-950">{link.label}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-600">{link.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading eyebrow="Start here" title="First 24 hours, first week, first month, first semester">
          The goal is not to master Claremont immediately. The goal is to avoid being clueless about the basics and make
          one confident move at a time.
        </SectionHeading>
        <div className="grid gap-4 lg:grid-cols-4">
          {timeline.map((section) => (
            <article key={section.title} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{section.kicker}</p>
              <h3 className="mt-2 text-xl font-bold text-gray-950">{section.title}</h3>
              <ol className="mt-4 space-y-3">
                {section.items.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-gray-700">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading eyebrow="Screenshot this" title="20 things every incoming 5C student should know">
          A compact list for the group chat: practical, low-drama, and useful before you know the acronyms.
        </SectionHeading>
        <NumberedList items={twentyThings} />
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <SectionHeading eyebrow="Social geography" title="What each campus is like, without making it your whole personality">
            These are shortcuts, not boxes. Use them to cross campus more confidently, not to stereotype people.
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {campusNotes.map((campus) => (
              <div key={campus.name} className="rounded-2xl bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-950">{campus.name}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">{campus.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Do this early</p>
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
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading eyebrow="Transit" title="How to get to LA without a car">
            Start with Claremont Station, check Metrolink times before you leave, and plan your return before your phone
            battery becomes the problem.
          </SectionHeading>
          <Link href="/explore" className="text-sm font-semibold text-primary underline underline-offset-4">
            Open the map before you go
          </Link>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading eyebrow="Food" title="Best cheap food habits">
            Cheap food is a system, not a single restaurant.
          </SectionHeading>
          <ul className="space-y-3 text-sm leading-6 text-gray-700">
            {cheapFood.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <Link href="/eat" className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-4">
            Use the Eat guide
          </Link>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading eyebrow="Work" title="Best study spots strategy">
            Do not wait until midterms to discover where you can actually focus.
          </SectionHeading>
          <ul className="space-y-3 text-sm leading-6 text-gray-700">
            {studySpots.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-5 md:p-6">
        <SectionHeading eyebrow="Next clicks" title="Turn this guide into a plan">
          Five minutes now can save you a month of random guessing.
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/deals" className="rounded-2xl bg-white p-4 text-sm font-semibold text-gray-950 shadow-sm">
            Save money with Deals
          </Link>
          <Link href="/housing" className="rounded-2xl bg-white p-4 text-sm font-semibold text-gray-950 shadow-sm">
            Learn Housing geography
          </Link>
          <Link href="/events" className="rounded-2xl bg-white p-4 text-sm font-semibold text-gray-950 shadow-sm">
            Pick one Event
          </Link>
          <Link href="/eat" className="rounded-2xl bg-white p-4 text-sm font-semibold text-gray-950 shadow-sm">
            Choose first meals
          </Link>
        </div>
      </section>
    </div>
  )
}
