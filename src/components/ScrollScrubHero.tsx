'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

// How many viewport heights of scroll = full video playback + all pillars done
const RUNWAY_VH = 5

const PILLARS = [
  { label: 'EVENTS',  href: '/events',  showAt: 0.05, hideAt: 0.22 },
  { label: 'EATS',    href: '/eat',     showAt: 0.25, hideAt: 0.45 },
  { label: 'HOUSING', href: '/housing', showAt: 0.48, hideAt: 0.68 },
  { label: 'DEALS',   href: '/deals',   showAt: 0.71, hideAt: 0.92 },
]

export function ScrollScrubHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pillarRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef({ target: 0, current: 0, ticking: false, ready: false })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const st = stateRef.current

    function init() {
      st.ready = true
      video!.pause()
      update()
    }

    if (video.readyState >= 1) init()
    else video.addEventListener('loadedmetadata', init, { once: true })

    function update() {
      if (!st.ready || !video) return
      const frac = Math.min(1, window.scrollY / (RUNWAY_VH * window.innerHeight))
      st.target = frac * video.duration

      pillarRefs.current.forEach((el, i) => {
        if (!el) return
        const p = PILLARS[i]
        const r = 0.05
        let o = 0
        if (frac >= p.showAt && frac <= p.hideAt) {
          if (frac < p.showAt + r)      o = (frac - p.showAt) / r
          else if (frac > p.hideAt - r) o = (p.hideAt - frac) / r
          else                          o = 1
        }
        o = Math.max(0, Math.min(1, o))
        const scale = 0.4 + o * 0.6
        el.style.opacity = String(o)
        el.style.transform = `scale(${scale})`
        el.style.pointerEvents = o > 0.05 ? 'auto' : 'none'
      })

      if (!st.ticking) {
        st.ticking = true
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    function tick() {
      if (!video) { st.ticking = false; return }
      st.current += (st.target - st.current) * 0.1
      if (Math.abs(st.current - st.target) < 0.005) st.current = st.target
      if (Math.abs(video.currentTime - st.current) > 0.016) {
        video.currentTime = st.current
      }
      if (Math.abs(st.current - st.target) > 0.005) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        st.ticking = false
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', update)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-lg h-full overflow-hidden">
        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          src="/claremont-hero-sharp-scrub.mp4"
          muted
          playsInline
          preload="auto"
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* Pillar links */}
        {PILLARS.map((p, i) => (
          <div
            key={p.label}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Link
              href={p.href}
              ref={(el) => { pillarRefs.current[i] = el }}
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(3.5rem, 18vw, 6.5rem)',
                letterSpacing: '0.12em',
                color: 'white',
                opacity: 0,
                transform: 'scale(0.4)',
                pointerEvents: 'none',
                textShadow: '0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.4)',
                textDecoration: 'none',
                display: 'block',
                lineHeight: 1,
              }}
            >
              {p.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
