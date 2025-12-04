'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  height?: 'auto' | '50%' | '75%' | '100%'
  excludeBottom?: number // Height in pixels to exclude from bottom (e.g., input bar height)
}

export function BottomSheet({ open, onOpenChange, children, height = 'auto', excludeBottom = 0 }: BottomSheetProps) {
  React.useEffect(() => {
    if (open) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const heightClasses = {
    'auto': 'max-h-[90vh]',
    '50%': 'h-[50vh]',
    '75%': 'h-[75vh]',
    '100%': 'h-screen'
  }

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50 bg-background rounded-t-2xl shadow-lg animate-in slide-in-from-bottom duration-300",
        heightClasses[height],
        "flex flex-col"
      )}
      style={{ bottom: `${excludeBottom}px` }}
    >
      {children}
    </div>
  )
}
