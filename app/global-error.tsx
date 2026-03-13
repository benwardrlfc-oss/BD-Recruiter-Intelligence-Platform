'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body style={{ backgroundColor: '#020817', color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
