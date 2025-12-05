'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Search, UserPlus, Check, Clock, MessageCircle } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/store/auth-store'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  friendshipStatus: 'pending' | 'accepted' | null
  friendshipId?: string
}

interface Friend {
  id: string
  username: string
  email: string
  avatar?: string
  friendshipId: string
  friendshipStatus: string
  isRequester: boolean
  createdAt: string
}

type TabType = 'friends' | 'received' | 'sent'

export default function FriendsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
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

  // 받은 친구 요청 조회
  const fetchReceivedRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/friends?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 내가 recipient인 요청만 필터링
        const received = data.friends.filter((f: Friend) => !f.isRequester)
        setReceivedRequests(received)
      }
    } catch (error) {
      console.error('받은 친구 요청 조회 오류:', error)
    }
  }, [token])

  // 보낸 친구 요청 조회
  const fetchSentRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/friends?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 내가 requester인 요청만 필터링
        const sent = data.friends.filter((f: Friend) => f.isRequester)
        setSentRequests(sent)
      }
    } catch (error) {
      console.error('보낸 친구 요청 조회 오류:', error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchFriends()
      fetchReceivedRequests()
      fetchSentRequests()
    }
  }, [token])

  // Socket.IO 실시간 연결
  useEffect(() => {
    if (!token) return

    const { socketManager } = require('@/lib/socket')

    // Socket 연결
    socketManager.connect('User', token)

    // 친구 요청 받기 이벤트
    const unsubscribeRequest = socketManager.onFriendRequest(() => {
      console.log('친구 요청을 받았습니다!')
      fetchReceivedRequests()
    })

    // 친구 수락 이벤트
    const unsubscribeAccepted = socketManager.onFriendAccepted(() => {
      console.log('친구 요청이 수락되었습니다!')
      fetch('/api/friends?status=accepted', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setFriends(data.friends))
        .catch(err => console.error(err))

      fetch('/api/friends?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const sent = data.friends.filter((f: Friend) => f.isRequester)
          setSentRequests(sent)
        })
        .catch(err => console.error(err))
    })

    // 정리
    return () => {
      unsubscribeRequest()
      unsubscribeAccepted()
    }
  }, [token])

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
        alert('친구 요청을 보냈습니다')
        handleSearch() // 검색 결과 새로고침
        fetchSentRequests() // 보낸 요청 목록 새로고침

        // Socket.IO로 실시간 알림
        const { socketManager } = require('@/lib/socket')
        if (data.recipientId) {
          socketManager.emit('friend:request', { recipientId: data.recipientId })
        }
      } else {
        const data = await response.json()
        alert(data.error || '친구 요청 실패')
      }
    } catch (error) {
      console.error('친구 요청 오류:', error)
      alert('친구 요청 중 오류가 발생했습니다')
    }
  }

  // 친구 요청 수락
  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert('친구 요청을 수락했습니다')
        fetchFriends()
        fetchReceivedRequests()

        // Socket.IO로 실시간 알림
        const { socketManager } = require('@/lib/socket')
        if (data.requesterId) {
          socketManager.emit('friend:accept', { requesterId: data.requesterId })
        }
      } else {
        const data = await response.json()
        alert(data.error || '친구 수락 실패')
      }
    } catch (error) {
      console.error('친구 수락 오류:', error)
      alert('친구 수락 중 오류가 발생했습니다')
    }
  }

  // 채팅하기
  const handleStartChat = async (friendId: string) => {
    try {
      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'direct',
          memberId: friendId
        })
      })

      if (response.ok) {
        const data = await response.json()
        // 생성된 채팅방으로 이동
        router.push(`/chat/${data.chatRoom._id}`)
      } else {
        alert('채팅방 생성 실패')
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error)
      alert('채팅방 생성 중 오류가 발생했습니다')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold mb-4">친구</h1>

        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="사용자명 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm text-muted-foreground">검색 결과</p>
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Avatar fallback={user.username[0]} className="h-10 w-10" />
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

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'friends'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          친구 ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'received'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          받은 요청 ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'sent'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          보낸 요청 ({sentRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">친구가 없습니다</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar fallback={friend.username[0]} className="h-10 w-10" />
                  <div className="flex-1">
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(friend.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    채팅하기
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'received' && (
          <div className="space-y-2">
            {receivedRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">받은 친구 요청이 없습니다</p>
            ) : (
              receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar fallback={request.username[0]} className="h-10 w-10" />
                  <div className="flex-1">
                    <p className="font-medium">{request.username}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.friendshipId)}
                  >
                    수락
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-2">
            {sentRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">보낸 친구 요청이 없습니다</p>
            ) : (
              sentRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar fallback={request.username[0]} className="h-10 w-10" />
                  <div className="flex-1">
                    <p className="font-medium">{request.username}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <span className="text-sm text-yellow-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 대기중
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
