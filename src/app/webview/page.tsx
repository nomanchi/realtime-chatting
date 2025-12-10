'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store/chat-store'
import { useAuthStore } from '@/store/auth-store'
import { socketManager } from '@/lib/socket'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function WebViewPage() {
  const router = useRouter()
  const { setCurrentUser, setOnlineUsers, addMessage, setConnectionStatus } = useChatStore()
  const { isAuthenticated, user: authUser, token } = useAuthStore()

  // 인증 체크 및 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (authUser) {
      const user = {
        id: authUser.id,
        name: authUser.username,
        isOnline: true
      }
      setCurrentUser(user)

      // Connect to Socket.io server with token
      socketManager.connect(authUser.username, token || undefined)

      // Listen for messages
      socketManager.onMessage((message) => {
        addMessage(message)
      })

      // Listen for connection status
      socketManager.onStatus((status) => {
        setConnectionStatus(status as any)
      })

      // Listen for online users
      socketManager.onUsers((users) => {
        setOnlineUsers(users.map(u => ({
          id: u.id,
          name: u.name,
          isOnline: true
        })))
      })
    }
  }, [isAuthenticated, authUser, token, router, setCurrentUser, addMessage, setConnectionStatus, setOnlineUsers])

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile-optimized header */}
      <ChatHeader title="채팅" className="shrink-0" showUserListPopover={true} />

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
