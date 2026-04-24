'use client'
import { useState } from 'react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('https://formspree.io/f/xpwzgvkj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-3 px-6 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-medium">You're on the list. We'll email you when it's ready.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining...' : 'Join waitlist'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-1 w-full">Something went wrong. Try again.</p>
      )}
    </form>
  )
}
