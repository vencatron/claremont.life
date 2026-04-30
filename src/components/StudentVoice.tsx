import { campusVoiceItems, featuredStudentPick } from '@/content/student-voice'

export function StudentVoice() {
  return (
    <section className="cl-container pb-8 md:pb-10">
      <div className="cl-card p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:items-stretch">
          <article className="rounded-[1.35rem] border border-border/80 bg-background/70 p-4 md:p-5">
            <p className="cl-eyebrow">
              {featuredStudentPick.label}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.045em] md:text-3xl">
              {featuredStudentPick.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {featuredStudentPick.copy}
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {featuredStudentPick.byline}
            </p>
          </article>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {campusVoiceItems.map((item) => (
              <article
                key={item.campus}
                className="rounded-[1.25rem] border border-border/75 bg-background/55 p-3 transition-colors hover:bg-white/75 md:p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.campus}
                  </p>
                  <p className="text-[0.68rem] font-medium text-muted-foreground">
                    {item.byline}
                  </p>
                </div>
                <h3 className="mt-2 text-sm font-semibold tracking-[-0.02em] md:text-base">{item.heading}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
