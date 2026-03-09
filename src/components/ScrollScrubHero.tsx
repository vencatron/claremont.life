'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// How many viewport heights of scroll = full video playback
const RUNWAY_VH = 5

// Pillar definitions — text overlays synced to scroll progress
const PILLARS = [
  { label: 'EVENTS',  href: '/events',  showAt: 0.28, peakAt: 0.34, hideAt: 0.42 },
  { label: 'EATS',    href: '/eat',     showAt: 0.42, peakAt: 0.48, hideAt: 0.56 },
  { label: 'HOUSING', href: '/housing', showAt: 0.56, peakAt: 0.62, hideAt: 0.70 },
  { label: 'DEALS',   href: '/deals',   showAt: 0.70, peakAt: 0.76, hideAt: 0.84 },
]

export function ScrollScrubHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef({ target: 0, current: 0, ticking: false, ready: false, unlocked: false })
  const [frac, setFrac] = useState(0)

  // iOS Safari requires a user gesture to "unlock" video for programmatic currentTime control.
  // We play() then immediately pause() on the first touch/scroll interaction.
  const unlockVideo = useCallback(() => {
    const video = videoRef.current
    const st = stateRef.current
    if (!video || st.unlocked) return
    st.unlocked = true

    // play() returns a promise on modern browsers; pause immediately after it resolves
    const p = video.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        video.pause()
        video.currentTime = st.target
      }).catch(() => {
        // Autoplay blocked — video will remain black until next gesture
      })
    } else {
      video.pause()
    }
  }, [])

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
      const f = Math.min(1, window.scrollY / (RUNWAY_VH * window.innerHeight))
      st.target = f * video.duration
      setFrac(f)

      // Unlock on first scroll (counts as user gesture on iOS)
      if (!st.unlocked) unlockVideo()

      if (!st.ticking) {
        st.ticking = true
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    function tick() {
      if (!video) { st.ticking = false; return }
      st.current += (st.target - st.current) * 0.15
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

    // Listen for both scroll and touch to unlock video ASAP
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('touchstart', unlockVideo, { once: true, passive: true })

    update()

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('touchstart', unlockVideo)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [unlockVideo])

  return (
    <>
    {/* Video layer — behind everything */}
    <div className="fixed inset-0 -z-10 flex justify-center">
      <div className="relative w-full max-w-lg h-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/claremont-pillars-float-scrub.mp4"
          muted
          playsInline
          preload="auto"
          poster=""
        />
      </div>
    </div>

    {/* Text overlay layer — above the scroll runway so taps register */}
    <div className="fixed inset-0 z-20 flex justify-center pointer-events-none">
      <div className="relative w-full max-w-lg h-full overflow-hidden">
        {PILLARS.map((p) => {
          const progress = getPillarProgress(frac, p.showAt, p.peakAt, p.hideAt)
          if (progress <= 0) return null

          // Scale: 0.3 → 1.0 during appear, keeps growing 1.0 → 2.0 during dissolve
          // Simulates text floating toward camera then passing through
          const scale = progress <= 1
            ? 0.3 + progress * 0.7
            : 1.0 + (progress - 1) * 1.0

          // Opacity: fade in, hold briefly at peak, then dissolve out
          const opacity = progress <= 0.4
            ? progress / 0.4
            : progress <= 1
            ? 1
            : Math.max(0, 1 - (progress - 1) * 1.2)

          return (
            <Link
              key={p.label}
              href={p.href}
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{
                pointerEvents: opacity > 0.3 ? 'auto' as const : 'none' as const,
              }}
            >
              <div
                className="flex flex-col items-center gap-3"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  willChange: 'transform, opacity',
                }}
              >
                <div className="w-48 h-px bg-white/60" />
                <span
                  className="text-white text-6xl font-extrabold tracking-[0.2em]"
                  style={{ fontFamily: 'var(--font-playfair), "Futura", "Bebas Neue", sans-serif' }}
                >
                  {p.label}
                </span>
                <div className="w-48 h-px bg-white/60" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
    </>
  )
}

/** Returns 0 when hidden, 0→1 during appear (showAt→peakAt), 1→2 during fade (peakAt→hideAt) */
function getPillarProgress(frac: number, showAt: number, peakAt: number, hideAt: number): number {
  if (frac < showAt || frac > hideAt) return 0
  if (frac <= peakAt) return (frac - showAt) / (peakAt - showAt)
  return 1 + (frac - peakAt) / (hideAt - peakAt)
}
