import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Bebas_Neue } from 'next/font/google'
import { BottomNav } from '@/components/BottomNav'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], variable: '--font-bebas', weight: '400', display: 'swap' })

export const metadata: Metadata = {
  title: 'claremont.life — Your guide to life in Claremont',
  description: 'The definitive living guide for students at the 7 Claremont Colleges.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${bebasNeue.variable}`}>
      <body className="bg-black text-foreground font-[family-name:var(--font-dm-sans)] antialiased">
        <main className="min-h-screen pb-24 max-w-lg mx-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
