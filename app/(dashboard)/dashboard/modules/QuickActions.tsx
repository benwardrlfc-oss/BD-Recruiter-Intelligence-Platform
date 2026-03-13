'use client'

import Link from 'next/link'
import { Users, Sparkles, Zap, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Link href="/candidates"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Users className="h-4 w-4" />Match a Candidate</Button></Link>
        <Link href="/scripts"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Sparkles className="h-4 w-4" />Generate BD Script</Button></Link>
        <Link href="/content"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Zap className="h-4 w-4" />Create LinkedIn Post</Button></Link>
        <Link href="/radar"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Target className="h-4 w-4" />Browse Signals</Button></Link>
      </CardContent>
    </Card>
  )
}
