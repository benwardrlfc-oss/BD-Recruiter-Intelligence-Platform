'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchButtonProps {
  isWatching: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function WatchButton({ isWatching, onToggle, size = 'sm', className }: WatchButtonProps) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
      title={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border transition-all duration-200 font-medium flex-shrink-0',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        isWatching
          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-red-900/20 hover:border-red-500/40 hover:text-red-400'
          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400',
        className
      )}
    >
      {isWatching ? (
        <BookmarkCheck className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      ) : (
        <Bookmark className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      {isWatching ? 'Watching' : 'Watch'}
    </button>
  )
}
