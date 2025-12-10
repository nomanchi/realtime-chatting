'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Check, Users } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Friend {
  id: string
  username: string
  email: string
  avatar?: string
}

export default function NewChatPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { showToast } = useToast()

  // 친구 목록 조회
  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends', {
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
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
  }, [token, router])

  // 친구 선택/해제 토글
  const toggleFriendSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends)
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId)
    } else {
      newSelection.add(friendId)
    }
    setSelectedFriends(newSelection)
  }

  // 채팅방 생성
  const handleCreateChat = async () => {
    if (selectedFriends.size === 0) return

    setCreating(true)

    try {
      const selectedIds = Array.from(selectedFriends)

      // 1명 선택: 1:1 채팅
      // 2명 이상 선택: 그룹 채팅
      const requestBody = selectedIds.length === 1
        ? { type: 'direct', memberId: selectedIds[0] }
        : {
            type: 'group',
            memberIds: selectedIds,
            name: groupName.trim() || undefined
          }

      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        // 생성된 채팅방으로 이동
        router.push(`/chat/${data.chatRoom._id}`)
      } else {
        const error = await response.json()
        showToast(error.error || '채팅방 생성에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error)
      showToast('채팅방 생성 중 오류가 발생했습니다.', 'error')
    } finally {
      setCreating(false)
    }
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
      <div className="flex items-center gap-3 p-4 pb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">새 채팅</h1>
          {selectedFriends.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedFriends.size}명 선택됨
            </p>
          )}
        </div>
      </div>

      {/* Friend List */}
      <div className="flex-1 overflow-y-auto">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Users className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">친구가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                친구를 먼저 추가해주세요
              </p>
            </div>
            <Button onClick={() => router.push('/friends')}>
              친구 추가하기
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {friends.map((friend) => {
              const isSelected = selectedFriends.has(friend.id)

              return (
                <button
                  key={friend.id}
                  onClick={() => toggleFriendSelection(friend.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      fallback={friend.username[0]}
                      className="h-12 w-12"
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

      {/* Bottom Action Area */}
      {selectedFriends.size > 0 && (
        <div className="pt-4 p-4 space-y-3">
          {/* 그룹 이름 입력 (2명 이상 선택 시) */}
          {selectedFriends.size >= 2 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                그룹 이름 (선택사항)
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="참여자 이름으로 자동 설정됩니다"
                className="w-full"
              />
            </div>
          )}

          <Button
            onClick={handleCreateChat}
            disabled={creating}
            className="w-full"
            size="lg"
          >
            {creating
              ? '생성 중...'
              : selectedFriends.size === 1
              ? '채팅 시작'
              : `그룹 채팅 만들기 (${selectedFriends.size}명)`}
          </Button>
        </div>
      )}
    </div>
  )
}
