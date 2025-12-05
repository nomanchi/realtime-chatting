'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, MessageCircle, Mail, User as UserIcon } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  username: string
  statusMessage?: string
  avatar?: string
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { token, user: currentUser } = useAuthStore()
  const { showToast } = useToast()
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 인증 체크 및 프로필 로드
  useEffect(() => {
    if (!isHydrated) return

    if (!token) {
      router.push('/login')
      return
    }

    // 자기 자신의 프로필이면 /profile로 리다이렉트
    if (currentUser && userId === currentUser.id) {
      router.push('/profile')
      return
    }

    fetchProfile()
  }, [token, router, isHydrated, userId, currentUser])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else {
        showToast('프로필을 불러올 수 없습니다', 'error')
        router.back()
      }
    } catch (error) {
      console.error('프로필 조회 오류:', error)
      showToast('프로필 조회 중 오류가 발생했습니다', 'error')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!profile) return

    try {
      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'direct',
          memberId: profile.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/chat/${data.chatRoom._id}`)
      } else {
        showToast('채팅방 생성 실패', 'error')
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error)
      showToast('채팅방 생성 중 오류가 발생했습니다', 'error')
    }
  }

  if (!isHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!profile) {
    return null
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
        <h1 className="text-2xl font-bold">프로필</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <Avatar
            src={profile.avatar}
            fallback={profile.username[0]?.toUpperCase() || '?'}
            className="h-24 w-24 text-4xl mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">{profile.username}</h2>
          {profile.statusMessage && (
            <p className="text-muted-foreground text-center max-w-md">
              {profile.statusMessage}
            </p>
          )}
        </div>

        {/* Profile Info */}
        <div className="max-w-md mx-auto space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">사용자명</p>
              <p className="font-medium">{profile.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">이메일</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleStartChat}
            className="w-full flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            채팅하기
          </Button>
        </div>
      </div>
    </div>
  )
}
