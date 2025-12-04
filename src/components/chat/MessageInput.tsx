'use client'

import { useState, KeyboardEvent } from 'react'
import { useChatStore } from '@/store/chat-store'
import { socketManager } from '@/lib/socket'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export function MessageInput() {
  const [message, setMessage] = useState('')
  const { currentUser } = useChatStore()

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

  return (
    <div className="flex items-center gap-2 p-4 border-t bg-background">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요..."
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim()}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
