'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/store/chat-store'
import { socketManager } from '@/lib/socket'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Users } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function BrowserPage() {
  const { setCurrentUser, setOnlineUsers, addMessage, setConnectionStatus, onlineUsers } = useChatStore()
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg border shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">실시간 채팅</h1>
            <p className="text-muted-foreground">이름을 입력하고 채팅에 참여하세요</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="이름을 입력하세요"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="text-lg"
              autoFocus
            />
            <Button
              onClick={handleJoin}
              className="w-full"
              size="lg"
              disabled={!userName.trim()}
            >
              채팅 참여하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        <ChatHeader title="실시간 채팅" className="shrink-0" />

        <div className="flex-1 overflow-hidden">
          <MessageList />
        </div>

        <div className="shrink-0">
          <MessageInput />
        </div>
      </div>

      {/* Sidebar - Desktop only */}
      <div className="hidden lg:flex lg:w-64 xl:w-80 flex-col border-l bg-muted/20">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">접속자 ({onlineUsers.length})</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="relative">
                  <Avatar fallback={user.name[0]} className="h-10 w-10" />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">온라인</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
