'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, Loader2, AlertCircle, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setState('error')
      } else {
        setState('sent')
      }
    } catch {
      setErrorMsg('An error occurred. Please try again.')
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/20">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BD Intelligence OS</h1>
          <p className="text-sm text-slate-400 mt-1">Market-aware recruitment intelligence</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50">

          {state === 'sent' ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center py-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/20 border border-emerald-800/60 mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="text-base font-semibold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-slate-400 mb-1">
                If an account exists for <span className="text-slate-300">{email}</span>, we've sent a password reset link.
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <Button
                variant="secondary"
                className="w-full mb-3"
                onClick={() => setState('idle')}
              >
                Try a different email
              </Button>
              <Link href="/login" className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ────────────────────────────────────────────────── */
            <>
              <h2 className="text-base font-semibold text-white mb-1">Reset your password</h2>
              <p className="text-sm text-slate-400 mb-6">
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {state === 'error' && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-800/60 px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={state === 'loading'}>
                  {state === 'loading'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    : <><span>Send reset link</span><ArrowRight className="h-4 w-4" /></>
                  }
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                Remember your password?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
