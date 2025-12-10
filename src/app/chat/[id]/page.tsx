'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Edit2, Check, X, UserPlus, MoreVertical, LogOut, Users } from 'lucide-react'
import { MessageInput } from '@/components/chat/MessageInput'
import { useToast } from '@/components/ui/toast'

interface ChatRoomData {
  _id: string
  name?: string
  customName?: string
  type: 'direct' | 'group'
  createdBy?: string
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
  const { themeColor } = useThemeStore()
  const [roomId, setRoomId] = useState<string>('')
  const [chatRoom, setChatRoom] = useState<ChatRoomData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMenuDropdown, setShowMenuDropdown] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showMembersPopover, setShowMembersPopover] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState(false)
  const { showToast } = useToast()
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

    // 새 메시지 수신 이벤트 리스닝
    const unsubscribeNewMessage = socketManager.onNewMessage((data: { roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📨 새 메시지 수신, 목록 재조회')
        // 메시지 목록 재조회
        const fetchMessagesAgain = async () => {
          try {
            const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
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
            console.error('메시지 재조회 오류:', error)
          }
        }
        fetchMessagesAgain()
      }
    })

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
      unsubscribeNewMessage()
      unsubscribeRead()
    }
  }, [token, roomId])

  // 메시지 스크롤
  useEffect(() => {
    // 메시지가 로드되면 즉시 하단으로 스크롤
    if (messagesEndRef.current) {
      // 초기 로딩일 때는 즉시 스크롤, 이후에는 부드럽게
      messagesEndRef.current.scrollIntoView({
        behavior: loading ? 'auto' : 'smooth'
      })
    }
  }, [messages, loading])

  // 채팅방 이름 가져오기
  const getRoomName = () => {
    if (!chatRoom) return '채팅방'

    // 1순위: 사용자가 설정한 커스텀 이름
    if (chatRoom.customName) {
      return chatRoom.customName
    }

    // 2순위: 1:1 채팅은 상대방 이름
    if (chatRoom.type === 'direct' && chatRoom.otherMember) {
      return chatRoom.otherMember.username
    }

    // 3순위: 그룹 채팅의 공통 이름 (설정된 경우 또는 자동 생성된 경우)
    if (chatRoom.name) {
      return chatRoom.name
    }

    // 4순위: 멤버 이름 나열 (기본값)
    return chatRoom.members
      .filter(m => m._id !== user?.id)
      .map(m => m.username)
      .join(', ') || '채팅방'
  }

  // 친구 초대 모달 열기
  const handleOpenInviteModal = async () => {
    try {
      // 친구 목록 조회
      const response = await fetch('/api/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 이미 채팅방에 있는 친구 제외
        const memberIds = chatRoom?.members.map(m => m._id) || []
        const availableFriends = data.friends.filter(
          (f: any) => !memberIds.includes(f.id)
        )
        setFriends(availableFriends)
        setShowInviteModal(true)
      }
    } catch (error) {
      console.error('친구 목록 조회 오류:', error)
    }
  }

  // 친구 초대
  const handleInviteFriends = async () => {
    if (selectedFriends.size === 0) return

    setInviting(true)

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberIds: Array.from(selectedFriends)
        })
      })

      if (response.ok) {
        const data = await response.json()
        // 채팅방 정보 업데이트
        setChatRoom(data.chatRoom)
        setShowInviteModal(false)
        setSelectedFriends(new Set())
        showToast('친구를 초대했습니다.', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || '친구 초대에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('친구 초대 오류:', error)
      showToast('친구 초대 중 오류가 발생했습니다.', 'error')
    } finally {
      setInviting(false)
    }
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

  // 채팅방 나가기
  const handleLeaveChatRoom = async () => {
    if (!roomId) return

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        showToast('채팅방에서 나갔습니다.', 'success')
        router.push('/chatrooms')
      } else {
        const error = await response.json()
        showToast(error.error || '채팅방 나가기에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('채팅방 나가기 오류:', error)
      showToast('채팅방 나가기 중 오류가 발생했습니다.', 'error')
    } finally {
      setShowLeaveDialog(false)
      setShowMenuDropdown(false)
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

  const colorClasses = {
    blue: 'bg-blue-200/30',
    purple: 'bg-purple-200/30',
    green: 'bg-green-200/30',
    orange: 'bg-orange-200/30',
    pink: 'bg-pink-200/30'
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 ${colorClasses[themeColor]} backdrop-blur-sm`}>
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
            <h1
              className={`flex-1 text-lg font-semibold truncate ${
                chatRoom?.type === 'direct' ? 'cursor-pointer hover:underline' : ''
              }`}
              onClick={() => {
                if (chatRoom?.type === 'direct' && chatRoom.otherMember) {
                  router.push(`/profile/${chatRoom.otherMember.id}`)
                }
              }}
            >
              {getRoomName()}
            </h1>
            {/* 그룹 채팅 멤버 수 */}
            {chatRoom?.type === 'group' && (
              <div className="relative">
                <button
                  onClick={() => setShowMembersPopover(!showMembersPopover)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{chatRoom.members.length}</span>
                </button>

                {/* 멤버 목록 팝오버 */}
                {showMembersPopover && (
                  <>
                    {/* 배경 오버레이 */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMembersPopover(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                      <div className="p-4">
                        <h3 className="font-semibold text-sm">참여자 {chatRoom.members.length}명</h3>
                      </div>
                      <div className="px-2 pb-2 space-y-1">
                        {chatRoom.members.map((member: any) => (
                          <div
                            key={member._id}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
                            onClick={() => {
                              setShowMembersPopover(false)
                              if (member._id !== user?.id) {
                                router.push(`/profile/${member._id}`)
                              } else {
                                router.push('/profile')
                              }
                            }}
                          >
                            <Avatar
                              src={member.avatar}
                              fallback={member.username[0]}
                              className="h-10 w-10"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{member.username}</p>
                              {member._id === chatRoom.createdBy && (
                                <span className="text-xs text-primary">방장</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 pt-2">
                        <button
                          onClick={() => {
                            setShowMembersPopover(false)
                            handleOpenInviteModal()
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-primary hover:bg-primary/10 transition-colors rounded-xl font-medium"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>대화 상대 초대하기</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* 메뉴 버튼 */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                title="메뉴"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {/* 드롭다운 메뉴 */}
              {showMenuDropdown && (
                <>
                  {/* 배경 오버레이 */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenuDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setShowMenuDropdown(false)
                          handleOpenInviteModal()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left rounded-xl"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>대화 상대 초대</span>
                      </button>
                      {chatRoom?.type === 'group' && (
                        <button
                          onClick={() => {
                            setShowMenuDropdown(false)
                            setEditedName(chatRoom?.name || '')
                            setIsEditingName(true)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left rounded-xl"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>채팅방 이름 변경</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowMenuDropdown(false)
                          setShowLeaveDialog(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-destructive/10 transition-colors text-left text-destructive rounded-xl"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>채팅방 나가기</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">메시지가 없습니다</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId._id === user?.id
            const prevMessage = index > 0 ? messages[index - 1] : null
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

            // 날짜가 바뀌었는지 확인
            const currentDate = new Date(message.timestamp)
            const prevDate = prevMessage ? new Date(prevMessage.timestamp) : null
            const showDateSeparator = !prevDate ||
              currentDate.toDateString() !== prevDate.toDateString()

            // 같은 사용자의 연속 메시지인지 확인 (같은 분 내에서)
            const isSameUser = prevMessage?.senderId._id === message.senderId._id
            const isSameMinute = prevMessage &&
              new Date(prevMessage.timestamp).getMinutes() === currentDate.getMinutes() &&
              new Date(prevMessage.timestamp).getHours() === currentDate.getHours()
            const isGroupStart = !isSameUser || !isSameMinute

            // 다음 메시지도 같은 그룹인지 확인
            const nextIsSameUser = nextMessage?.senderId._id === message.senderId._id
            const nextIsSameMinute = nextMessage &&
              new Date(nextMessage.timestamp).getMinutes() === currentDate.getMinutes() &&
              new Date(nextMessage.timestamp).getHours() === currentDate.getHours()
            const isGroupEnd = !nextIsSameUser || !nextIsSameMinute

            return (
              <div key={message._id}>
                {/* 날짜 구분자 */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
                      <p className="text-xs font-medium text-muted-foreground">
                        {currentDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* 메시지 */}
                <div
                  className={`flex gap-2.5 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                    !isGroupStart ? (isOwnMessage ? 'mt-0.5' : 'mt-0.5') : 'mt-3'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0" style={{ width: '36px' }}>
                      {isGroupStart && (
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/profile/${message.senderId._id}`)}
                        >
                          <Avatar
                            src={message.senderId.avatar}
                            fallback={message.senderId.username[0]}
                            className="h-9 w-9 ring-2 ring-background shadow-sm hover:ring-primary/50 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {!isOwnMessage && isGroupStart && (
                      <span
                        className="text-xs font-medium text-muted-foreground mb-1 px-1 cursor-pointer hover:underline"
                        onClick={() => router.push(`/profile/${message.senderId._id}`)}
                      >
                        {message.senderId.username}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 shadow-sm ${
                        isOwnMessage
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                          : 'bg-muted/80 backdrop-blur-sm'
                      }`}
                    >
                      {message.imageData && (
                        <img
                          src={message.imageData}
                          alt="첨부 이미지"
                          className="max-w-full rounded-xl mb-2 shadow-md"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    {isGroupEnd && (
                      <div className="flex items-center gap-2 px-1">
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

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 pb-3">
              <h2 className="text-lg font-semibold">친구 초대</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInviteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Friend List */}
            <div className="flex-1 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">초대 가능한 친구가 없습니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {friends.map((friend) => {
                    const isSelected = selectedFriends.has(friend.id)

                    return (
                      <button
                        key={friend.id}
                        onClick={() => {
                          const newSelection = new Set(selectedFriends)
                          if (newSelection.has(friend.id)) {
                            newSelection.delete(friend.id)
                          } else {
                            newSelection.add(friend.id)
                          }
                          setSelectedFriends(newSelection)
                        }}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="relative">
                          <Avatar
                            src={friend.avatar}
                            fallback={friend.username[0]}
                            className="h-10 w-10"
                          />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-left">
                          <p className="font-medium">{friend.username}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {friend.email}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedFriends.size > 0 && (
              <div className="pt-4 p-4">
                <Button
                  onClick={handleInviteFriends}
                  disabled={inviting}
                  className="w-full"
                >
                  {inviting ? '초대 중...' : `${selectedFriends.size}명 초대하기`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Chat Room Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLeaveDialog(false)}>
          <div className="bg-background rounded-lg shadow-lg max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">채팅방 나가기</h3>
            <p className="text-muted-foreground mb-6">
              채팅방에서 나가시겠습니까? 나가면 이 채팅방의 메시지를 더 이상 볼 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveChatRoom}
              >
                나가기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
