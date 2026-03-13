'use client'

import { GripVertical, EyeOff, Expand, Shrink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModuleSize, MODULE_CATALOGUE } from './module-catalogue'

export function ModuleWrapper({
  id, size, isEditMode, isDragOver, isDragging,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onHide, onToggleSize, children,
}: {
  id: string
  size: ModuleSize
  isEditMode: boolean
  isDragOver: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onHide: () => void
  onToggleSize: () => void
  children: React.ReactNode
}) {
  const def = MODULE_CATALOGUE.find((m) => m.id === id)
  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        size === 'full' ? 'col-span-2' : 'col-span-1',
        isEditMode && isDragOver && !isDragging && 'ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-slate-950 rounded-xl',
        isEditMode && isDragging && 'opacity-40 scale-[0.98]',
      )}
      draggable={isEditMode}
      onDragStart={isEditMode ? onDragStart : undefined}
      onDragOver={isEditMode ? onDragOver : undefined}
      onDrop={isEditMode ? onDrop : undefined}
      onDragEnd={isEditMode ? onDragEnd : undefined}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <button
            onClick={onToggleSize}
            title={size === 'full' ? 'Make half-width' : 'Make full-width'}
            className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {size === 'full' ? <Shrink className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onHide}
            title="Hide module"
            className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {isEditMode && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
          <div className="h-7 px-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1.5 text-slate-400">
            <GripVertical className="h-3.5 w-3.5" />
            <span className="text-xs">{def?.label}</span>
          </div>
        </div>
      )}
      <div className={cn(isEditMode && 'pt-2')}>
        {children}
      </div>
    </div>
  )
}
