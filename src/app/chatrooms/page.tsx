'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Plus, Users } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/store/auth-store'

dayjs.extend(relativeTime)
dayjs.locale('ko')

interface ChatRoom {
  _id: string
  name?: string
  customName?: string  // 사용자별 커스텀 이름
  type: 'direct' | 'group'
  members: any[]
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number  // 읽지 않은 메시지 개수
  otherMember?: {
    id: string
    username: string
    email: string
    avatar?: string
  }
}

export default function ChatRoomsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editedName, setEditedName] = useState('')
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 채팅방 목록 조회
  const fetchChatRooms = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/chatrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChatRooms(data.chatRooms)
      }
    } catch (error) {
      console.error('채팅방 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  // 인증 체크 (hydration 완료 후에만)
  useEffect(() => {
    if (!isHydrated) return

    if (!token) {
      router.push('/login')
      return
    }
    fetchChatRooms()
  }, [token, router, isHydrated, fetchChatRooms])

  // Socket.IO 실시간 연결
  useEffect(() => {
    if (!token) return

    const { socketManager } = require('@/lib/socket')

    // Socket 연결
    socketManager.connect('User', token)

    // 새 메시지 알림
    const unsubscribe = socketManager.onNewMessage((data: { roomId: string }) => {
      console.log('📨 새 메시지 알림:', data.roomId)
      fetch('/api/chatrooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setChatRooms(data.chatRooms))
        .catch(err => console.error(err))
    })

    // 정리
    return () => {
      unsubscribe()
    }
  }, [token])



  useEffect(() => {
    fetchChatRooms()
  }, [])

  // 롱프레스 시작
  const handleLongPressStart = (roomId: string, currentName: string) => {
    const timer = setTimeout(() => {
      setEditingRoomId(roomId)
      setEditedName(currentName || '')
    }, 500) // 500ms 롱프레스
    setLongPressTimer(timer)
  }

  // 롱프레스 취소
  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // 이름 수정 저장
  const handleSaveName = async (roomId: string) => {
    if (!editedName.trim()) {
      setEditingRoomId(null)
      return
    }

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editedName.trim() })
      })

      if (response.ok) {
        // 로컬 상태 업데이트
        setChatRooms(prev =>
          prev.map(room =>
            room._id === roomId ? { ...room, customName: editedName.trim() } : room
          )
        )
        setEditingRoomId(null)
      }
    } catch (error) {
      console.error('채팅방 이름 수정 오류:', error)
    }
  }

  // 채팅방 이름 가져오기
  const getChatRoomName = (room: ChatRoom) => {
    // 1순위: 사용자가 설정한 커스텀 이름
    if (room.customName) {
      return room.customName
    }

    // 2순위: 커스텀 이름이 있으면 항상 우선
    if (room.name) {
      return room.name
    }

    // 1:1 채팅: 상대방 이름
    if (room.type === 'direct' && room.otherMember) {
      return room.otherMember.username
    }

    // 그룹 채팅: 기본값
    return '그룹 채팅'
  }

  // 채팅방 아바타 가져오기
  const getChatRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'direct' && room.otherMember) {
      return room.otherMember.username[0]
    }
    return '그'
  }

  // 시간 포맷팅
  const formatTime = (dateString?: string) => {
    if (!dateString) return ''

    try {
      return dayjs(dateString).fromNow()
    } catch {
      return ''
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="text-2xl font-bold">채팅방</h1>
          <p className="text-sm text-muted-foreground">
            {chatRooms.length}개의 채팅방
          </p>
        </div>
        <Button onClick={() => router.push('/friends')}>
          <Plus className="h-4 w-4 mr-2" />
          새 채팅
        </Button>
      </div>

      {/* Chat Room List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <MessageCircle className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">채팅방이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                친구를 추가하고 채팅을 시작해보세요
              </p>
            </div>
            <Button onClick={() => router.push('/friends')}>
              친구 추가하기
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {chatRooms.map((room) => (
              <div key={room._id} className="relative">
                <button
                  onClick={() => {
                    if (!editingRoomId) {
                      router.push(`/chat/${room._id}`)
                    }
                  }}
                  onTouchStart={() => handleLongPressStart(room._id, getChatRoomName(room))}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(room._id, getChatRoomName(room))}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors"
                >
                  <div className="relative">
                    <Avatar
                      fallback={getChatRoomAvatar(room)}
                      className="h-12 w-12"
                    />
                    {room.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Users className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {room.unreadCount && room.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-bold px-1">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      {editingRoomId === room._id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(room._id)
                              if (e.key === 'Escape') setEditingRoomId(null)
                            }}
                            placeholder="채팅방 이름"
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveName(room._id)
                            }}
                          >
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingRoomId(null)
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      ) : (
                        <p className="font-medium truncate">
                          {getChatRoomName(room)}
                        </p>
                      )}
                      {editingRoomId !== room._id && room.lastMessageAt && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatTime(room.lastMessageAt)}
                        </span>
                      )}
                    </div>

                    {editingRoomId !== room._id && room.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {room.lastMessage}
                      </p>
                    )}

                    {editingRoomId !== room._id && room.type === 'group' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {room.members.length}명
                      </p>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
