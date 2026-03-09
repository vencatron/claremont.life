'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// How many viewport heights of scroll = full video playback
const RUNWAY_VH = 5

const COLLEGES = ['Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI']

// Pillar definitions — text overlays synced to scroll progress
const PILLARS = [
  { label: 'EVENTS',  href: '/events',  showAt: 0.28, peakAt: 0.34, hideAt: 0.42 },
  { label: 'EATS',    href: '/eat',     showAt: 0.42, peakAt: 0.48, hideAt: 0.56 },
  { label: 'HOUSING', href: '/housing', showAt: 0.56, peakAt: 0.62, hideAt: 0.70 },
  { label: 'DEALS',   href: '/deals',   showAt: 0.70, peakAt: 0.76, hideAt: 0.84 },
]

export function ScrollScrubHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef({ target: 0, current: 0, ticking: false, ready: false, unlocked: false, audioUnlocked: false })
  const [frac, setFrac] = useState(0)

  // iOS Safari requires a user gesture to "unlock" video/audio for programmatic control.
  const unlockMedia = useCallback(() => {
    const video = videoRef.current
    const audio = audioRef.current
    const st = stateRef.current

    // Unlock video
    if (video && !st.unlocked) {
      st.unlocked = true
      const p = video.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          video.pause()
          video.currentTime = st.target
        }).catch(() => {})
      } else {
        video.pause()
      }
    }

    // Unlock and start background beat
    if (audio && !st.audioUnlocked) {
      audio.volume = 0.1
      audio.play().then(() => {
        st.audioUnlocked = true
      }).catch(() => {
        // iOS rejected — will retry on next gesture
      })
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
      if (!st.unlocked) unlockMedia()

      // Fade audio out when past the hero section
      const audio = audioRef.current
      if (audio && st.audioUnlocked) {
        if (f > 0.95) {
          audio.volume = Math.max(0, 0.1 * (1 - (f - 0.95) / 0.05))
        } else {
          audio.volume = 0.1
        }
      }

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
    // Multiple event types to maximize chance of iOS audio unlock
    const gestureEvents = ['touchstart', 'touchend', 'click', 'scroll'] as const
    window.addEventListener('scroll', update, { passive: true })
    gestureEvents.forEach(evt => {
      window.addEventListener(evt, unlockMedia, { passive: true })
    })

    update()

    return () => {
      window.removeEventListener('scroll', update)
      gestureEvents.forEach(evt => {
        window.removeEventListener(evt, unlockMedia)
      })
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [unlockMedia])

  return (
    <>
    {/* Background beat — soft Not Like Us instrumental loop */}
    <audio ref={audioRef} src="/bg-beat.mp3" loop preload="auto" />

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

        {/* Bottom banner — "featuring" bar with all 7 colleges */}
        <div
          className="absolute bottom-16 left-0 right-0 z-10"
          style={{ opacity: frac < 0.9 ? 1 : Math.max(0, (1 - frac) / 0.1) }}
        >
          <div className="mx-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 px-4 py-3">
            <p
              className="text-center text-white/50 text-[9px] tracking-[0.25em] uppercase mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              The Claremont Colleges
            </p>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {COLLEGES.map((c, i) => (
                <span key={c} className="flex items-center gap-2">
                  <span className="text-white/70 text-[10px] tracking-wider font-medium whitespace-nowrap">
                    {c}
                  </span>
                  {i < COLLEGES.length - 1 && (
                    <span className="text-white/30 text-[8px]">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

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
