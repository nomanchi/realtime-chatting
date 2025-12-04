'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/store/chat-store'
import { socketManager } from '@/lib/socket'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function WebViewPage() {
  const { setCurrentUser, setOnlineUsers, addMessage, setConnectionStatus } = useChatStore()
  const [userName, setUserName] = useState('')
  const [isJoined, setIsJoined] = useState(false)

  const handleJoin = () => {
    if (!userName.trim()) return

    const user = {
      id: `user-${Date.now()}`,
      name: userName,
      isOnline: true
    }
    setCurrentUser(user)
    setIsJoined(true)

    // Connect to Socket.io server
    socketManager.connect(userName)

    // Listen for messages
    const unsubscribeMessage = socketManager.onMessage((message) => {
      addMessage(message)
    })

    // Listen for connection status
    const unsubscribeStatus = socketManager.onStatus((status) => {
      setConnectionStatus(status as any)
    })

    // Listen for online users
    const unsubscribeUsers = socketManager.onUsers((users) => {
      setOnlineUsers(users.map(u => ({
        id: u.id,
        name: u.name,
        isOnline: true
      })))
    })
  }

  useEffect(() => {
    return () => {
      if (isJoined) {
        socketManager.disconnect()
      }
    }
  }, [isJoined])

  if (!isJoined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">채팅</h1>
            <p className="text-sm text-muted-foreground">이름을 입력하세요</p>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="이름"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="h-12"
              autoFocus
            />
            <Button
              onClick={handleJoin}
              className="w-full h-12"
              disabled={!userName.trim()}
            >
              참여하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile-optimized header */}
      <ChatHeader title="채팅" className="shrink-0" />

      {/* Message area */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="shrink-0">
        <MessageInput />
      </div>
    </div>
  )
}
