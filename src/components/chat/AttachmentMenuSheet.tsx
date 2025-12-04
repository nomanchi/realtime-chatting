'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { X, Image as ImageIcon, Camera, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttachmentMenuSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageSelect: () => void
}

export function AttachmentMenuSheet({ open, onOpenChange, onImageSelect }: AttachmentMenuSheetProps) {
  const handleImageClick = () => {
    onImageSelect()
    onOpenChange(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} height="auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-medium flex-1 text-center mr-10">첨부하기</h2>
      </div>

      {/* Menu Items */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {/* 앨범 */}
          <button
            onClick={handleImageClick}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <ImageIcon className="h-7 w-7 text-green-500" />
            </div>
            <span className="text-xs font-medium">앨범</span>
          </button>

          {/* 카메라 (준비 중) */}
          <button
            className="flex flex-col items-center gap-3 opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Camera className="h-7 w-7 text-blue-500" />
            </div>
            <span className="text-xs font-medium">카메라</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
