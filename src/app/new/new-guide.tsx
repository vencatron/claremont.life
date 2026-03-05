'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const WEEK_1 = [
  'Get your student ID at the registrar — you need it for everything',
  'Download the Foothill Transit app. Line 187 → Pomona Metrolink. Line 190 → downtown LA.',
  'Find your nearest laundromat (most are on College Ave near the colleges)',
  'Walk every block of the Village at least once — it takes 20 minutes',
  'Note which dining hall has late-night hours before you need them at midnight',
  'Bookmark claremont.life',
  'Find the Honnold-Mudd Library — it\'s open to all 7 colleges',
  'Learn where the 24-hour spaces on your campus are',
]

const MONTH_1 = [
  'Set up a bank account if you haven\'t — Chase and BofA both have Village branches',
  'Get a good bike lock. Theft is real on College Ave.',
  'Subscribe to this newsletter — it\'s weekly, free, and worth it',
  'Find a study spot that isn\'t your dorm: Ath patio (CMC), Honnold reading room, Zing! on Yale',
  'Learn which student discounts you qualify for → /deals',
  'Download the Metrolink app. LA is 45 minutes away for $10.',
  'Attend at least one event at a college that isn\'t yours',
]

const SEMESTER_1 = [
  'Trader Joe\'s is on Foothill Blvd — 10 min by bike. Target is right next to it.',
  'Understand your student health insurance before you need it',
  'Join one cross-college student org. The 5C community is the whole point.',
  'Go to an Athenaeum dinner at CMC — open to all 5C students, free with RSVP',
  'Do a day trip: Joshua Tree (1.5 hrs), Laguna Beach (1 hr), downtown LA via Metrolink (45 min)',
  'Go to the Claremont Farmers Market on Sunday morning in the Village',
  'Introduce yourself to the campus correspondent for your college — they want to hear from you',
]

function ChecklistSection({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3 px-4 py-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">{i + 1}</span>
          <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  )
}

export function NewGuide() {
  return (
    <Tabs defaultValue="week1" className="px-4">
      <TabsList className="w-full">
        <TabsTrigger value="week1" className="flex-1">Week 1</TabsTrigger>
        <TabsTrigger value="month1" className="flex-1">Month 1</TabsTrigger>
        <TabsTrigger value="semester1" className="flex-1">Semester 1</TabsTrigger>
      </TabsList>
      <TabsContent value="week1"><ChecklistSection items={WEEK_1} /></TabsContent>
      <TabsContent value="month1"><ChecklistSection items={MONTH_1} /></TabsContent>
      <TabsContent value="semester1"><ChecklistSection items={SEMESTER_1} /></TabsContent>
    </Tabs>
  )
}
