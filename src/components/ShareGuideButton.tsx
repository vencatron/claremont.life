'use client'

import { useState } from 'react'

type ShareGuideButtonProps = {
  title: string
  text: string
  url?: string
  className?: string
}

export function ShareGuideButton({ title, text, url, className = '' }: ShareGuideButtonProps) {
  const [status, setStatus] = useState('')

  async function handleShare() {
    const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
    const fallbackMessage = shareUrl
      ? `Copy this URL from the address bar: ${shareUrl}`
      : 'Copy this page URL from your browser address bar.'

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url: shareUrl })
        setStatus('Shared.')
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl)
        setStatus('Link copied.')
        return
      }

      setStatus(fallbackMessage)
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setStatus('Link copied.')
          return
        } catch {
          // Fall through to the no-clipboard fallback below.
        }
      }

      setStatus(fallbackMessage)
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex w-full items-center justify-center rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 sm:w-auto"
      >
        Share / copy guide
      </button>
      {status && <p className="text-xs leading-5 text-gray-600" aria-live="polite">{status}</p>}
    </div>
  )
}
