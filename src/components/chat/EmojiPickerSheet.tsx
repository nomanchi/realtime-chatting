'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { X, Search, Smile, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmojiPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmojiSelect: (emoji: string) => void
}

type TabType = 'search' | 'emoji' | 'mini'

export function EmojiPickerSheet({ open, onOpenChange, onEmojiSelect }: EmojiPickerSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emoji')

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji)
    onOpenChange(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} height="75%" excludeBottom={72}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          검색
        </button>
        <button
          onClick={() => setActiveTab('emoji')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'emoji'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          이모티콘
        </button>
        <button
          onClick={() => setActiveTab('mini')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'mini'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          미니
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'emoji' && (
          <div className="flex justify-center p-4">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={400}
              searchPlaceHolder="이모지 검색"
              previewConfig={{
                showPreview: false
              }}
            />
          </div>
        )}
        {activeTab === 'search' && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mb-4" />
            <p>검색 기능은 준비 중입니다</p>
          </div>
        )}
        {activeTab === 'mini' && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Smile className="h-12 w-12 mb-4" />
            <p>미니 이모티콘은 준비 중입니다</p>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
