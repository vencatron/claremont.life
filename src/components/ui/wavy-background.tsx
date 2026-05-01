"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useRef } from "react"
import { createNoise3D } from "simplex-noise"

type WavyBackgroundProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode
  containerClassName?: string
  canvasClassName?: string
  colors?: string[]
  waveWidth?: number
  backgroundFill?: string
  blur?: number
  speed?: "slow" | "fast"
  waveOpacity?: number
  waveCount?: number
  amplitude?: number
}

const DEFAULT_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#0f766e", "#f59e0b"]

export function WavyBackground({
  children,
  className,
  containerClassName,
  canvasClassName,
  colors = DEFAULT_COLORS,
  waveWidth = 34,
  backgroundFill = "rgba(252, 249, 241, 0.78)",
  blur = 10,
  speed = "slow",
  waveOpacity = 0.34,
  waveCount = 5,
  amplitude = 76,
  ...props
}: WavyBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveColors = colors.length > 0 ? colors : DEFAULT_COLORS

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) {
      return
    }

    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return
    }

    const noise = createNoise3D()
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const speedStep = speed === "fast" ? 0.002 : 0.001
    let width = 0
    let height = 0
    let noiseTime = 0
    let animationId = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(rect.width, 1)
      height = Math.max(rect.height, 1)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.filter = `blur(${blur}px)`
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = backgroundFill
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = waveOpacity
      ctx.lineCap = "round"

      for (let waveIndex = 0; waveIndex < waveCount; waveIndex += 1) {
        ctx.beginPath()
        ctx.lineWidth = waveWidth
        ctx.strokeStyle = waveColors[waveIndex % waveColors.length]

        for (let x = -40; x <= width + 40; x += 5) {
          const y = noise(x / 720, waveIndex * 0.28, noiseTime) * amplitude + height * 0.52
          ctx.lineTo(x, y)
        }

        ctx.stroke()
        ctx.closePath()
      }

      ctx.globalAlpha = 1
    }

    const render = () => {
      noiseTime += motionQuery.matches ? 0 : speedStep
      draw()

      if (!motionQuery.matches) {
        animationId = requestAnimationFrame(render)
      }
    }

    const restart = () => {
      cancelAnimationFrame(animationId)
      resize()
      render()
    }

    restart()
    const resizeObserver = new ResizeObserver(restart)
    resizeObserver.observe(container)
    motionQuery.addEventListener("change", restart)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      motionQuery.removeEventListener("change", restart)
    }
  }, [amplitude, backgroundFill, blur, speed, waveColors, waveCount, waveOpacity, waveWidth])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", containerClassName)}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-55"
      >
        {waveColors.slice(0, waveCount).map((color, index) => (
          <path
            key={`${color}-${index}`}
            d={`M -80 ${260 + index * 28} C 180 ${170 + index * 18}, 330 ${360 - index * 18}, 560 ${270 + index * 22} S 910 ${190 + index * 18}, 1280 ${285 - index * 12}`}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={Math.max(waveWidth * 0.58, 12)}
            opacity={Math.max(waveOpacity - index * 0.025, 0.12)}
          />
        ))}
      </svg>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 z-0 h-full w-full", canvasClassName)}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  )
}
