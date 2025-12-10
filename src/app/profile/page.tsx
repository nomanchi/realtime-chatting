'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, Camera } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { token, user, setUser } = useAuthStore()
  const { themeColor } = useThemeStore()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarData, setAvatarData] = useState<string | null>(null)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 인증 체크 및 프로필 데이터 로드
  useEffect(() => {
    if (!isHydrated) return

    if (!token) {
      router.push('/login')
      return
    }

    if (user) {
      setUsername(user.username)
      setStatusMessage(user.statusMessage || '')
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [token, router, isHydrated, user])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (2MB 제한)
    if (file.size > 2 * 1024 * 1024) {
      showToast('이미지 크기는 2MB 이하여야 합니다', 'error')
      return
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 업로드 가능합니다', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setAvatarPreview(base64String)
      setAvatarData(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!username.trim()) {
      showToast('사용자명을 입력해주세요', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          statusMessage: statusMessage.trim(),
          avatar: avatarData || user?.avatar
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        showToast('프로필이 업데이트되었습니다', 'success')
        router.push('/friends')
      } else {
        const data = await response.json()
        showToast(data.error || '프로필 업데이트 실패', 'error')
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      showToast('프로필 업데이트 중 오류가 발생했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isHydrated || !user) {
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${colorClasses[themeColor]} backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">프로필 편집</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={loading}
          className="text-primary hover:text-primary/80"
        >
          <Save className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6 p-8 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl">
          <div
            onClick={handleAvatarClick}
            className="relative group cursor-pointer mb-3"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-primary/20 shadow-lg"
              />
            ) : (
              <Avatar
                fallback={username[0]?.toUpperCase() || '?'}
                className="h-32 w-32 text-5xl ring-4 ring-primary/20 shadow-lg"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Camera className="h-10 w-10 text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-sm font-medium text-primary">프로필 사진 변경</p>
          <p className="text-xs text-muted-foreground mt-1">2MB 이하의 이미지만 가능합니다</p>
        </div>

        {/* Form */}
        <div className="space-y-4 max-w-md mx-auto">
          {/* Email (read-only) */}
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              이메일
            </label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>

          {/* Username */}
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              사용자명
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자명을 입력하세요"
              maxLength={30}
              className="border-0 bg-muted/50 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {username.length}/30
            </p>
          </div>

          {/* Status Message */}
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              상태 메시지
            </label>
            <Input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="상태 메시지를 입력하세요"
              maxLength={100}
              className="border-0 bg-muted/50 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {statusMessage.length}/100
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
