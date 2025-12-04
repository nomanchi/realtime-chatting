'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { useChatStore } from '@/store/chat-store'
import { socketManager } from '@/lib/socket'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Plus, Smile } from 'lucide-react'
import { EmojiPickerSheet } from './EmojiPickerSheet'
import { AttachmentMenuSheet } from './AttachmentMenuSheet'

export function MessageInput() {
  const [message, setMessage] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false)
  const { currentUser } = useChatStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim() || !currentUser) return

    socketManager.sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: message.trim(),
      status: 'sent'
    })

    setMessage('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string

      socketManager.sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: message.trim() || '이미지',
        imageData: base64,
        status: 'sent'
      })

      setMessage('')
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-t bg-background">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* + Button */}
        <Button
          onClick={() => setAttachmentMenuOpen(true)}
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="첨부하기"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="flex-1"
        />

        {/* Emoji Button */}
        <Button
          onClick={() => setEmojiOpen(!emojiOpen)}
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="이모티콘"
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Emoji Picker Sheet */}
      <EmojiPickerSheet
        open={emojiOpen}
        onOpenChange={setEmojiOpen}
        onEmojiSelect={handleEmojiSelect}
      />

      {/* Attachment Menu Sheet */}
      <AttachmentMenuSheet
        open={attachmentMenuOpen}
        onOpenChange={setAttachmentMenuOpen}
        onImageSelect={() => fileInputRef.current?.click()}
      />
    </>
  )
}
