'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageCircle, Settings } from 'lucide-react'
import { useThemeStore } from '@/store/theme-store'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState } from 'react'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { themeColor } = useThemeStore()
  const { token } = useAuthStore()
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // 친구 요청 개수 조회
  useEffect(() => {
    if (!token) return

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch('/api/friends?status=pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // 받은 요청만 카운트 (isRequester가 false인 것)
          const receivedCount = data.friends.filter((f: any) => !f.isRequester).length
          setFriendRequestCount(receivedCount)
        }
      } catch (error) {
        console.error('친구 요청 조회 오류:', error)
      }
    }

    fetchFriendRequests()

    // 10초마다 갱신
    const interval = setInterval(fetchFriendRequests, 10000)

    return () => clearInterval(interval)
  }, [token])

  // 안읽은 메시지 개수 조회
  useEffect(() => {
    if (!token) return

    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch('/api/chatrooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // 모든 채팅방의 unreadCount 합산
          const totalUnread = data.chatRooms.reduce((sum: number, room: any) =>
            sum + (room.unreadCount || 0), 0
          )
          setUnreadMessageCount(totalUnread)
        }
      } catch (error) {
        console.error('채팅방 조회 오류:', error)
      }
    }

    fetchUnreadMessages()

    // 10초마다 갱신
    const interval = setInterval(fetchUnreadMessages, 10000)

    return () => clearInterval(interval)
  }, [token])

  const navItems = [
    {
      name: '친구',
      icon: Users,
      path: '/friends',
      badge: friendRequestCount
    },
    {
      name: '채팅',
      icon: MessageCircle,
      path: '/chatrooms',
      badge: unreadMessageCount
    },
    {
      name: '설정',
      icon: Settings,
      path: '/settings'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-200/30',
    purple: 'bg-purple-200/30',
    green: 'bg-green-200/30',
    orange: 'bg-orange-200/30',
    pink: 'bg-pink-200/30'
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${colorClasses[themeColor]} backdrop-blur-sm z-50`}>
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || pathname?.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {(item.badge ?? 0) > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">
                      {item.badge! > 9 ? '9+' : item.badge}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
