'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/theme-store'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Search, UserPlus } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/store/auth-store'

interface Friend {
  id: string
  username: string
  email: string
  avatar?: string
  statusMessage?: string
  friendshipId: string
  friendshipStatus: string
  isRequester: boolean
  createdAt: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { themeColor } = useThemeStore()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 인증 체크 (hydration 완료 후에만)
  useEffect(() => {
    if (isHydrated && !token) {
      router.push('/login')
    }
  }, [token, router, isHydrated])

  // 친구 목록 조회
  const fetchFriends = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/friends?status=accepted', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('친구 목록 조회 오류:', error)
    }
  }, [token])

  // 친구 요청 개수 조회
  const fetchFriendRequests = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/friends?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 받은 요청만 카운트
        const receivedCount = data.friends.filter((f: Friend) => !f.isRequester).length
        setFriendRequestCount(receivedCount)
      }
    } catch (error) {
      console.error('친구 요청 조회 오류:', error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchFriends()
      fetchFriendRequests()
    }
  }, [token, fetchFriends, fetchFriendRequests])

  // Socket.IO 실시간 연결
  useEffect(() => {
    if (!token) return

    const { socketManager } = require('@/lib/socket')

    // Socket 연결
    socketManager.connect('User', token)

    // 친구 요청 받기 이벤트
    const unsubscribeRequest = socketManager.onFriendRequest(() => {
      console.log('새로운 친구 요청!')
      fetchFriendRequests()
    })

    // 친구 수락 이벤트 - 친구 목록 새로고침
    const unsubscribeAccepted = socketManager.onFriendAccepted(() => {
      console.log('친구 요청이 수락되었습니다!')
      fetchFriends()
      fetchFriendRequests()
    })

    // 정리
    return () => {
      unsubscribeRequest()
      unsubscribeAccepted()
    }
  }, [token, fetchFriends, fetchFriendRequests])

  const colorClasses = {
    blue: 'bg-blue-200/30',
    purple: 'bg-purple-200/30',
    green: 'bg-green-200/30',
    orange: 'bg-orange-200/30',
    pink: 'bg-pink-200/30'
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className={`p-4 pb-2 ${colorClasses[themeColor]} backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">친구</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/friends/search')}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings/friend-requests')}
              className="relative"
            >
              <UserPlus className="h-5 w-5" />
              {friendRequestCount > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {friendRequestCount > 9 ? '9+' : friendRequestCount}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* My Profile Section */}
        <div
          onClick={() => router.push('/profile')}
          className="p-4 rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar}
              fallback={user?.username?.[0]?.toUpperCase() || '?'}
              className="h-16 w-16 text-2xl"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{user?.username}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.statusMessage || '상태 메시지를 설정해보세요'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              친구 {friends.length}
            </p>
          </div>

          <div className="space-y-1">
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">친구가 없습니다</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => router.push(`/profile/${friend.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Avatar
                    src={friend.avatar}
                    fallback={friend.username[0]}
                    className="h-12 w-12"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {friend.statusMessage || ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
