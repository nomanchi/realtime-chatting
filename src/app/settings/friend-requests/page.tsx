'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Check } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/toast'

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

type TabType = 'received' | 'sent'

export default function FriendRequestsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
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

  // 받은 친구 요청 조회
  const fetchReceivedRequests = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/friends?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const received = data.friends.filter((f: Friend) => !f.isRequester)
        setReceivedRequests(received)
      }
    } catch (error) {
      console.error('받은 친구 요청 조회 오류:', error)
    }
  }, [token])

  // 보낸 친구 요청 조회
  const fetchSentRequests = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/friends?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const sent = data.friends.filter((f: Friend) => f.isRequester)
        setSentRequests(sent)
      }
    } catch (error) {
      console.error('보낸 친구 요청 조회 오류:', error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchReceivedRequests()
      fetchSentRequests()
    }
  }, [token, fetchReceivedRequests, fetchSentRequests])

  // Socket.IO 실시간 연결
  useEffect(() => {
    if (!token) return

    const { socketManager } = require('@/lib/socket')
    socketManager.connect('User', token)

    // 친구 요청 받기 이벤트
    const unsubscribeRequest = socketManager.onFriendRequest(() => {
      console.log('친구 요청을 받았습니다!')
      fetchReceivedRequests()
    })

    // 친구 수락 이벤트
    const unsubscribeAccepted = socketManager.onFriendAccepted(() => {
      console.log('친구 요청이 수락되었습니다!')
      fetchSentRequests()
    })

    return () => {
      unsubscribeRequest()
      unsubscribeAccepted()
    }
  }, [token, fetchReceivedRequests, fetchSentRequests])

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
        showToast('친구 요청을 수락했습니다', 'success')
        fetchReceivedRequests()

        // Socket.IO로 실시간 알림
        const { socketManager } = require('@/lib/socket')
        if (data.requesterId) {
          socketManager.emit('friend:accept', { requesterId: data.requesterId })
        }
      } else {
        const data = await response.json()
        showToast(data.error || '친구 수락 실패', 'error')
      }
    } catch (error) {
      console.error('친구 수락 오류:', error)
      showToast('친구 수락 중 오류가 발생했습니다', 'error')
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
        <h1 className="text-2xl font-bold">친구 요청 관리</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
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
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'received' && (
          <div className="space-y-2">
            {receivedRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">받은 친구 요청이 없습니다</p>
            ) : (
              receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar
                    src={request.avatar}
                    fallback={request.username[0]}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{request.username}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.friendshipId)}
                  >
                    <Check className="h-4 w-4 mr-1" />
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
                  <Avatar
                    src={request.avatar}
                    fallback={request.username[0]}
                    className="h-10 w-10"
                  />
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
    </div>
  )
}
