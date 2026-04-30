'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { subscribeNewsletter } from '@/lib/data'

interface NewsletterSignupProps {
  heading?: string
}

export function NewsletterSignup({ heading = 'Get useful Claremont updates.' }: NewsletterSignupProps) {
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
      <div className="cl-card px-4 py-8 text-center">
        <p className="text-lg font-semibold text-primary">{message}</p>
      </div>
    )
  }

  return (
    <div className="cl-card px-4 py-6 md:px-6 md:py-7">
      <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.045em] md:text-3xl">{heading}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Useful Claremont updates only. No spam, no resale, unsubscribe anytime.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input type="email" placeholder="your@email.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="min-h-12 flex-1 rounded-full bg-background/80 px-4" />
          <Button type="submit" disabled={status === 'loading'} className="min-h-12 shrink-0 rounded-full bg-foreground px-5 text-background hover:bg-foreground/90">
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      </div>
      {status === 'error' && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  )
}
