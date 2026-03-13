'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Brain, Loader2, AlertCircle, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Inner component ────────────────────────────────────────────────────────────

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<'loading' | 'form' | 'error'>('loading')
  const [invite, setInvite] = useState<{ email: string; orgName: string; role: string } | null>(null)
  const [tokenError, setTokenError] = useState('')

  const [form, setForm] = useState({ name: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No invite token provided. Please use the link from your invitation email.')
      setState('error')
      return
    }

    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setTokenError(data.error)
          setState('error')
        } else {
          setInvite(data)
          setState('form')
        }
      })
      .catch(() => {
        setTokenError('Failed to validate invite. Please try again or contact support.')
        setState('error')
      })
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setSubmitError('Password must be at least 8 characters.')
      return
    }
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to accept invite. Please try again.')
        return
      }

      // Sign in automatically after accepting
      const result = await signIn('credentials', {
        email: invite?.email,
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/dashboard')
      } else {
        router.push('/login?registered=true')
      }
    } catch {
      setSubmitError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Validating your invite…</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/20">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BD Intelligence OS</h1>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20 border border-red-800/60 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Invalid invite link</h2>
            <p className="text-sm text-slate-400 mb-6">{tokenError}</p>
            <Link href="/login">
              <Button variant="secondary" className="w-full">Go to sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/20">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BD Intelligence OS</h1>
          <p className="text-sm text-slate-400 mt-1">Market-aware recruitment intelligence</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50">

          {/* Invite banner */}
          <div className="mb-6 rounded-xl border border-indigo-600/30 bg-indigo-600/10 px-4 py-3">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">You've been invited</p>
            <p className="text-sm text-white font-medium">{invite?.orgName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Joining as <span className="text-slate-300">{invite?.role?.replace('_', ' ')}</span> · {invite?.email}
            </p>
          </div>

          <h2 className="text-base font-semibold text-white mb-1">Complete your account</h2>
          <p className="text-sm text-slate-400 mb-6">Set your name and a password to get started.</p>

          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <Input
                value={invite?.email ?? ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Create a password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-800/60 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>
                : <><span>Accept invite & join</span><ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            Your account will be added to the organisation immediately
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By accepting, you agree to our{' '}
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    }>
      <InviteForm />
    </Suspense>
  )
}
