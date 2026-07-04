import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Bebas_Neue } from 'next/font/google'
import { BottomNav } from '@/components/BottomNav'
import { DesktopNav } from '@/components/DesktopNav'
import { LaunchTrustFooter } from '@/components/LaunchTrustFooter'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], variable: '--font-bebas', weight: '400', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://claremont.life'),
  title: {
    default: 'claremont.life — Your guide to life in Claremont',
    template: '%s | claremont.life',
  },
  description:
    'Events, food, student deals, off-campus housing, and practical guides for the 7 Claremont Colleges and the Claremont Village. No account, no app, no ads.',
  openGraph: {
    siteName: 'claremont.life',
    type: 'website',
    locale: 'en_US',
    url: 'https://claremont.life',
    images: [
      {
        url: '/hero-claremont-palms.webp',
        width: 1200,
        height: 630,
        alt: 'Palm trees over the Claremont Village',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${bebasNeue.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <DesktopNav />
        <LayoutWrapper>{children}</LayoutWrapper>
        <LaunchTrustFooter />
        <BottomNav />
      </body>
    </html>
  )
}
