import { campusVoiceItems, featuredStudentPick } from '@/content/student-voice'

export function StudentVoice() {
  return (
    <section className="px-4 pb-6 md:px-6 md:pb-8 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-white shadow-lg md:border-border md:bg-card md:p-6 md:text-card-foreground md:shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:items-stretch">
            <article className="rounded-2xl border border-white/15 bg-black/20 p-4 md:border-border md:bg-background/50 md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 md:text-muted-foreground">
                {featuredStudentPick.label}
              </p>
              <h2
                className="mt-2 text-2xl font-semibold leading-tight md:text-3xl"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {featuredStudentPick.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/80 md:text-muted-foreground">
                {featuredStudentPick.copy}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-white/50 md:text-muted-foreground">
                {featuredStudentPick.byline}
              </p>
            </article>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {campusVoiceItems.map((item) => (
                <article
                  key={item.campus}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3 md:border-border md:bg-background/40 md:p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50 md:text-muted-foreground">
                      {item.campus}
                    </p>
                    <p className="text-[0.68rem] font-medium text-white/45 md:text-muted-foreground">
                      {item.byline}
                    </p>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold md:text-base">{item.heading}</h3>
                  <p className="mt-2 text-sm leading-5 text-white/75 md:text-muted-foreground">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
