'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

// How many viewport heights of scroll = full video playback
const RUNWAY_VH = 5

// Invisible tap targets — match when each pillar is visible in the baked video
const PILLARS = [
  { label: 'EVENTS',  href: '/events',  showAt: 0.05, hideAt: 0.22 },
  { label: 'EATS',    href: '/eat',     showAt: 0.25, hideAt: 0.45 },
  { label: 'HOUSING', href: '/housing', showAt: 0.48, hideAt: 0.68 },
  { label: 'DEALS',   href: '/deals',   showAt: 0.71, hideAt: 0.92 },
]

export function ScrollScrubHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const tapRefs = useRef<(HTMLAnchorElement | null)[]>([])
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

      // Show/hide invisible tap targets to match visible pillar in video
      tapRefs.current.forEach((el, i) => {
        if (!el) return
        const p = PILLARS[i]
        const visible = frac >= p.showAt && frac <= p.hideAt
        el.style.pointerEvents = visible ? 'auto' : 'none'
        el.style.opacity = visible ? '1' : '0'
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
    <div className="fixed inset-0 -z-10 flex justify-center">
      <div className="relative w-full max-w-lg h-full overflow-hidden">
        {/* Baked video — pillars are part of the footage */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/claremont-pillars-float-scrub.mp4"
          muted
          playsInline
          preload="auto"
        />

        {/* Invisible full-area tap targets — one per pillar, only active when pillar is on screen */}
        {PILLARS.map((p, i) => (
          <Link
            key={p.label}
            href={p.href}
            ref={(el) => { tapRefs.current[i] = el }}
            aria-label={p.label}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
