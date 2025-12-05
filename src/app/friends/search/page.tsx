'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, UserPlus, Check, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/toast'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  friendshipStatus: 'pending' | 'accepted' | null
  friendshipId?: string
}

export default function FriendSearchPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 인증 체크
  useEffect(() => {
    if (isHydrated && !token) {
      router.push('/login')
    }
  }, [token, router, isHydrated])

  // 사용자 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 친구 요청 전송
  const handleSendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        showToast('친구 요청을 보냈습니다', 'success')
        handleSearch() // 검색 결과 새로고침

        // Socket.IO로 실시간 알림
        const { socketManager } = require('@/lib/socket')
        if (data.recipientId) {
          socketManager.emit('friend:request', { recipientId: data.recipientId })
        }
      } else {
        const data = await response.json()
        showToast(data.error || '친구 요청 실패', 'error')
      }
    } catch (error) {
      console.error('친구 요청 오류:', error)
      showToast('친구 요청 중 오류가 발생했습니다', 'error')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">친구 검색</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="사용자명 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchResults.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? '검색 결과가 없습니다' : '사용자명 또는 이메일로 검색하세요'}
          </p>
        ) : (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Avatar src={user.avatar} fallback={user.username[0]} className="h-12 w-12" />
                <div className="flex-1">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {user.friendshipStatus === 'accepted' && (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="h-4 w-4" /> 친구
                  </span>
                )}
                {user.friendshipStatus === 'pending' && (
                  <span className="text-sm text-yellow-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 대기중
                  </span>
                )}
                {!user.friendshipStatus && (
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(user.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    친구 추가
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
