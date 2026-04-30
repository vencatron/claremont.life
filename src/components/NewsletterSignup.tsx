'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { subscribeNewsletter } from '@/lib/data'

interface NewsletterSignupProps {
  heading?: string
}

export function NewsletterSignup({ heading = 'Weekly. Free. Worth it.' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const result = await subscribeNewsletter(email)
    setStatus(result.success ? 'success' : 'error')
    setMessage(result.message)
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-lg font-semibold text-primary">{message}</p>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>{heading}</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        A weekly Claremont student digest. No spam, no resale, unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input type="email" placeholder="your@email.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="flex-1" />
        <Button type="submit" disabled={status === 'loading'} className="bg-primary hover:bg-primary/90 text-white shrink-0">
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      {status === 'error' && <p className="text-sm text-red-600 mt-2">{message}</p>}
    </div>
  )
}
