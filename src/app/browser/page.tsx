'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useChatStore } from '@/store/chat-store'
import { useAuthStore } from '@/store/auth-store'
import { socketManager } from '@/lib/socket'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { Users, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { logout as logoutApi } from '@/lib/api'

export default function BrowserPage() {
  const router = useRouter()
  const { setCurrentUser, setOnlineUsers, addMessage, setConnectionStatus, onlineUsers } = useChatStore()
  const { isAuthenticated, user: authUser, logout: clearAuth, token } = useAuthStore()

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

  const handleLogout = async () => {
    try {
      await logoutApi()
      clearAuth()
      socketManager.disconnect()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h1 className="text-xl font-semibold">실시간 채팅</h1>
          {authUser && (
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-muted-foreground">로그인:</span>{' '}
                <span className="font-medium">{authUser.username}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          )}
        </div>

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
