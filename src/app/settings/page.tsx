'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Moon, Sun, LogOut, User, Mail } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 인증 체크
  useEffect(() => {
    if (!isHydrated) return

    if (!token) {
      router.push('/login')
    }
  }, [token, router, isHydrated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-sm text-muted-foreground">
          계정 정보 및 앱 설정
        </p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Account Information */}
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold mb-4">계정 정보</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              fallback={user.username[0].toUpperCase()}
              className="h-16 w-16 text-2xl"
            />
            <div>
              <p className="font-medium text-lg">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">사용자 이름</p>
                <p className="font-medium">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">이메일</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold mb-4">테마</h2>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div className="text-left">
                <p className="font-medium">다크 모드</p>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? '켜짐' : '꺼짐'}
                </p>
              </div>
            </div>
            <div
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Logout */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">계정 관리</h2>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
