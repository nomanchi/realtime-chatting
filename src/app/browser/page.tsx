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
  const [userName, setUserName] = useState('')
  const [isJoined, setIsJoined] = useState(false)

  // 인증된 사용자는 자동으로 참여
  useEffect(() => {
    if (isAuthenticated && authUser && !isJoined) {
      const user = {
        id: authUser.id,
        name: authUser.username,
        isOnline: true
      }
      setCurrentUser(user)
      setIsJoined(true)

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
  }, [isAuthenticated, authUser, isJoined, token, setCurrentUser, addMessage, setConnectionStatus, setOnlineUsers])

  const handleJoin = () => {
    if (!userName.trim()) return

    const user = {
      id: `user-${Date.now()}`,
      name: userName,
      isOnline: true
    }
    setCurrentUser(user)
    setIsJoined(true)

    // Connect to Socket.io server (anonymous)
    socketManager.connect(userName)

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

  const handleLogout = async () => {
    try {
      await logoutApi()
      clearAuth()
      socketManager.disconnect()
      router.push('/')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
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
            <p className="text-muted-foreground">
              {isAuthenticated ? '채팅에 참여 중...' : '이름을 입력하고 채팅에 참여하세요'}
            </p>
          </div>

          {!isAuthenticated && (
            <>
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

              <div className="text-center text-sm text-muted-foreground">
                <p>또는</p>
                <div className="flex gap-2 justify-center mt-2">
                  <Link href="/login" className="text-primary hover:underline">
                    로그인
                  </Link>
                  <span>·</span>
                  <Link href="/register" className="text-primary hover:underline">
                    회원가입
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h1 className="text-xl font-semibold">실시간 채팅</h1>
          {isAuthenticated && authUser && (
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
