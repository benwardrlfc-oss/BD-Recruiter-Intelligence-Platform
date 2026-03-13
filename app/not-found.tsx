import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-slate-400">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
