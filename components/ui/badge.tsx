import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white',
        secondary: 'border-transparent bg-slate-700 text-slate-300',
        destructive: 'border-transparent bg-red-900/50 text-red-400',
        outline: 'text-slate-400 border-slate-700',
        success: 'border-transparent bg-emerald-900/50 text-emerald-400',
        warning: 'border-transparent bg-amber-900/50 text-amber-400',
        high: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
        medium: 'border-indigo-500/30 bg-indigo-500/20 text-indigo-400',
        low: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
        critical: 'border-red-500/30 bg-red-500/20 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
