'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Edit2, Check, X } from 'lucide-react'
import { MessageInput } from '@/components/chat/MessageInput'

interface ChatRoomData {
  _id: string
  name?: string
  type: 'direct' | 'group'
  members: Array<{
    _id: string
    username: string
    email: string
    avatar?: string
  }>
  otherMember?: {
    id: string
    username: string
    email: string
    avatar?: string
  }
}

interface Message {
  _id: string
  content: string
  senderId: {
    _id: string
    username: string
    avatar?: string
  }
  timestamp: number
  imageData?: string
  unreadCount?: number
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [roomId, setRoomId] = useState<string>('')
  const [chatRoom, setChatRoom] = useState<ChatRoomData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // params 로딩
  useEffect(() => {
    params.then(p => setRoomId(p.id))
  }, [params])

  // 채팅방 정보 로드
  useEffect(() => {
    if (!token || !roomId) return

    const fetchChatRoom = async () => {
      try {
        const response = await fetch(`/api/chatrooms/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setChatRoom(data.chatRoom)
        }
      } catch (error) {
        console.error('채팅방 정보 로드 오류:', error)
      }
    }

    fetchChatRoom()
  }, [token, roomId])

  // 메시지 로드
  useEffect(() => {
    if (!token || !roomId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages)

          // 자동 읽음 처리: 마지막 메시지 ID로 업데이트
          if (data.messages.length > 0) {
            const lastMessageId = data.messages[data.messages.length - 1]._id
            const readResponse = await fetch(`/api/chatrooms/${roomId}/read`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ messageId: lastMessageId })
            })

            // Socket.IO로 읽음 처리 알림
            if (readResponse.ok) {
              const readData = await readResponse.json()
              const { socketManager } = require('@/lib/socket')
              if (readData.roomId && readData.memberIds) {
                socketManager.emit('message:read', {
                  roomId: readData.roomId,
                  memberIds: readData.memberIds
                })
                console.log('✅ 읽음 처리 Socket.IO 알림 전송')
              }
            }
          }
        }
      } catch (error) {
        console.error('메시지 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [token, roomId])

  // Socket.IO 연결
  useEffect(() => {
    if (!token || !roomId) return

    const { socketManager } = require('@/lib/socket')

    // Socket 연결
    console.log('🔌 채팅 페이지 Socket.IO 연결 시작')
    socketManager.connect('User', token)

    // 읽음 처리 이벤트 리스닝
    const unsubscribeRead = socketManager.onMessageRead((data: { roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📖 상대가 메시지를 읽음, 목록 재조회')
        // 메시지 목록 재조회하여 unreadCount 업데이트
        const fetchMessagesAgain = async () => {
          try {
            const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
              const data = await response.json()
              setMessages(data.messages)
            }
          } catch (error) {
            console.error('메시지 재조회 오류:', error)
          }
        }
        fetchMessagesAgain()
      }
    })

    // 정리: 이벤트 리스너만 제거, 연결은 유지
    return () => {
      console.log('🔌 채팅 페이지 Socket.IO 이벤트 리스너 정리')
      unsubscribeRead()
    }
  }, [token, roomId])

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 채팅방 이름 가져오기
  const getRoomName = () => {
    if (!chatRoom) return '채팅방'

    if (chatRoom.name) {
      return chatRoom.name
    }

    if (chatRoom.type === 'direct' && chatRoom.otherMember) {
      return chatRoom.otherMember.username
    }

    // 그룹 채팅: 참여자 이름 나열
    return chatRoom.members
      .filter(m => m._id !== user?.id)
      .map(m => m.username)
      .join(', ')
  }

  // 채팅방 이름 수정
  const handleSaveName = async () => {
    if (!editedName.trim() || !roomId) return

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
        const data = await response.json()
        setChatRoom(prev => prev ? { ...prev, name: data.name } : null)
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('채팅방 이름 수정 오류:', error)
    }
  }

  if (!token) {
    router.push('/login')
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
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

        {isEditingName ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="채팅방 이름 입력"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="flex-1 text-lg font-semibold truncate">
              {getRoomName()}
            </h1>
            {chatRoom?.type === 'group' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditedName(chatRoom?.name || '')
                  setIsEditingName(true)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">메시지가 없습니다</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId._id === user?.id

            return (
              <div
                key={message._id}
                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && (
                  <Avatar
                    fallback={message.senderId.username[0]}
                    className="h-8 w-8"
                  />
                )}
                <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {!isOwnMessage && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {message.senderId.username}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.imageData && (
                      <img
                        src={message.imageData}
                        alt="첨부 이미지"
                        className="max-w-full rounded mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isOwnMessage && message.unreadCount !== undefined && message.unreadCount > 0 && (
                      <span className="text-xs text-yellow-600 font-semibold">
                        {message.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        roomId={roomId}
        onMessageSent={() => {
          // 메시지 전송 후 목록 새로고침
          if (token && roomId) {
            fetch(`/api/chatrooms/${roomId}/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(data => setMessages(data.messages))
              .catch(err => console.error(err))
          }
        }}
      />
    </div>
  )
}
