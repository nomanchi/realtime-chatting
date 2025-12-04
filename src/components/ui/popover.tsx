'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  trigger: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

export function Popover({ open, onOpenChange, children, trigger, align = 'center' }: PopoverProps) {
  const popoverRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  return (
    <div className="relative inline-block">
      <div onClick={() => onOpenChange(!open)}>
        {trigger}
      </div>

      {open && (
        <div
          ref={popoverRef}
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'end' && 'right-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
