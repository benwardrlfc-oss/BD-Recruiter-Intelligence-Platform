'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Brain, Loader2, AlertCircle, Eye, EyeOff, Mail, User, Building2, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Signup type ────────────────────────────────────────────────────────────────

type SignupType = 'individual' | 'org'

// ── Google icon ────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Microsoft icon ─────────────────────────────────────────────────────────────

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#f25022" d="M1 1h10v10H1z"/>
      <path fill="#00a4ef" d="M13 1h10v10H13z"/>
      <path fill="#7fba00" d="M1 13h10v10H1z"/>
      <path fill="#ffb900" d="M13 13h10v10H13z"/>
    </svg>
  )
}

// ── Inner form component ───────────────────────────────────────────────────────

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invite = searchParams.get('invite')

  const [signupType, setSignupType] = useState<SignupType>('individual')
  const [step, setStep] = useState<'type' | 'form'>(invite ? 'form' : 'type')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    orgName: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSocialSignup = (provider: 'google' | 'azure-ad') => {
    const { signIn } = require('next-auth/react')
    signIn(provider, { callbackUrl: '/dashboard' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password,
        signupType,
      }
      if (signupType === 'org') body.orgName = form.orgName

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        return
      }
      router.push('/login?registered=true')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Type selector step ─────────────────────────────────────────────────────

  if (step === 'type') {
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
            <h2 className="text-base font-semibold text-white mb-2">How are you signing up?</h2>
            <p className="text-sm text-slate-400 mb-6">Choose the option that best describes you.</p>

            <div className="space-y-3">
              {/* Individual */}
              <button
                onClick={() => { setSignupType('individual'); setStep('form') }}
                className="w-full text-left flex items-start gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:border-indigo-600 hover:bg-indigo-600/5 transition-all group"
              >
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/30">
                  <User className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Individual recruiter</p>
                  <p className="text-xs text-slate-400 mt-0.5">Sign up solo — we'll create a personal workspace for you.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 ml-auto mt-1 transition-colors" />
              </button>

              {/* Organisation */}
              <button
                onClick={() => { setSignupType('org'); setStep('form') }}
                className="w-full text-left flex items-start gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:border-indigo-600 hover:bg-indigo-600/5 transition-all group"
              >
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/30">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Recruitment firm</p>
                  <p className="text-xs text-slate-400 mt-0.5">Register your firm — you'll be the organisation admin and can invite your team.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 ml-auto mt-1 transition-colors" />
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Registration form step ─────────────────────────────────────────────────

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

          {/* Header + back */}
          <div className="flex items-center gap-3 mb-6">
            {!invite && (
              <button
                onClick={() => setStep('type')}
                className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1"
              >
                ← Back
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">
                {signupType === 'org' ? 'Register your firm' : 'Create your account'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {signupType === 'org'
                  ? 'You'll be set up as organisation admin with a 14-day free trial.'
                  : 'Get started with a personal workspace on the free trial.'}
              </p>
            </div>
          </div>

          {/* Social signup buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={() => handleSocialSignup('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              onClick={() => handleSocialSignup('azure-ad')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all disabled:opacity-50"
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-600">or sign up with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {signupType === 'org' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Organisation name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    value={form.orgName}
                    onChange={set('orgName')}
                    placeholder="Your recruiting firm"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
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

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-800/60 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : <><span>Create account</span><ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </form>

          {/* Trial note */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            14-day free trial · No credit card required
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
