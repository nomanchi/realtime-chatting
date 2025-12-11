import { useState, KeyboardEvent, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Plus, Smile } from 'lucide-react'
import { EmojiPickerSheet } from './EmojiPickerSheet'
import { AttachmentMenuSheet } from './AttachmentMenuSheet'
import { useToast } from '@/components/ui/toast'

interface MessageInputProps {
  roomId?: string
  onMessageSent?: () => void
}

export function MessageInput({ roomId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false)
  const { token, user } = useAuthStore()
  const { themeColor } = useThemeStore()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!message.trim() || !user || !roomId || !token) return

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: message.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage('')
        onMessageSent?.()

        // Socket.IO로 실시간 알림
        console.log('📨 메시지 전송 완료, Socket.IO 알림 준비:', data)
        const { socketManager } = require('@/lib/socket')
        if (data.roomId && data.memberIds) {
          socketManager.emit('message:new', {
            roomId: data.roomId,
            memberIds: data.memberIds
          })
          console.log('✅ Socket.IO 알림 전송 완료')
        } else {
          console.warn('⚠️ roomId 또는 memberIds 누락:', data)
        }
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !roomId || !token) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 선택할 수 있습니다.', 'error')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('이미지 크기는 5MB 이하여야 합니다.', 'error')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string

      try {
        const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content: message.trim() || '이미지',
            imageData: base64
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessage('')
          onMessageSent?.()

          // Socket.IO로 실시간 알림
          const { socketManager } = require('@/lib/socket')
          if (data.roomId && data.memberIds) {
            socketManager.emit('message:new', {
              roomId: data.roomId,
              memberIds: data.memberIds
            })
            console.log('✅ 이미지 메시지 Socket.IO 알림 전송 완료')
          }
        }
      } catch (error) {
        console.error('이미지 전송 오류:', error)
      }
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const colorClasses = {
    blue: 'bg-blue-200/30',
    purple: 'bg-purple-200/30',
    green: 'bg-green-200/30',
    orange: 'bg-orange-200/30',
    pink: 'bg-pink-200/30'
  }

  return (
    <>
      <div className={`flex items-center gap-3 p-4 ${colorClasses[themeColor]} backdrop-blur-sm`}>
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
          className="shrink-0 h-10 w-10 rounded-2xl hover:bg-primary/10"
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
          className="flex-1 h-10 rounded-2xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-muted-foreground/60 shadow-sm"
        />

        {/* Emoji Button */}
        <Button
          onClick={() => setEmojiOpen(!emojiOpen)}
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-2xl hover:bg-primary/10"
          title="이모티콘"
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md disabled:opacity-50"
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
