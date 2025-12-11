'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore, ThemeColor } from '@/store/theme-store'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Moon, Sun, LogOut, ChevronRight, UserCog, Trash2, Palette } from 'lucide-react'
import { logout as logoutApi } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const { isDarkMode, toggleTheme, themeColor, setThemeColor } = useThemeStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'theme'>('account')

  // Hydration 체크
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutApi()  // 서버 쿠키 삭제
      logout()           // Zustand 상태 초기화
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 에러가 발생해도 로컬 상태는 초기화
      logout()
      router.push('/login')
    }
  }

  if (!user || !isHydrated) {
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

  const menuItems = [
    { id: 'account' as const, label: '계정', icon: UserCog },
    { id: 'theme' as const, label: '테마', icon: Palette }
  ]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className={`p-4 pb-3 ${colorClasses[themeColor]} backdrop-blur-sm`}>
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden pb-20">
        {/* Sidebar */}
        <div className="w-28 border-r border-border/50 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full p-4 flex flex-col items-center gap-2 transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="p-6 space-y-6">
              {/* Account Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">계정 정보</h2>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-background/60 to-muted/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={user?.avatar}
                        fallback={user.username[0].toUpperCase()}
                        className="h-16 w-16 ring-2 ring-primary/20 shadow-md text-2xl"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">사용자 이름</p>
                        <p className="font-semibold text-lg">{user.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-background/60 to-muted/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">이메일</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div>
                <h2 className="text-lg font-semibold mb-4">계정 관리</h2>
                <div className="bg-gradient-to-br from-background/60 to-muted/30 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                  {/* 프로필 변경 */}
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">프로필 변경</p>
                        <p className="text-xs text-muted-foreground">사용자 정보 수정</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  {/* 로그아웃 */}
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <LogOut className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-orange-600">로그아웃</p>
                        <p className="text-xs text-muted-foreground">계정에서 로그아웃</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  {/* 회원 탈퇴 */}
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-destructive">회원 탈퇴</p>
                        <p className="text-xs text-muted-foreground">계정 영구 삭제</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="p-6 space-y-6">
              {/* Theme Color */}
              <div>
                <h2 className="text-lg font-semibold mb-4">테마 색상</h2>
                <div className="bg-gradient-to-br from-background/60 to-muted/30 backdrop-blur-sm rounded-2xl p-5 shadow-sm">
                  <div className="grid grid-cols-5 gap-3">
                    {(['blue', 'purple', 'green', 'orange', 'pink'] as ThemeColor[]).map((color) => {
                      const colors = {
                        blue: 'bg-blue-500',
                        purple: 'bg-purple-500',
                        green: 'bg-green-500',
                        orange: 'bg-orange-500',
                        pink: 'bg-pink-500'
                      }

                      return (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className={`relative h-14 rounded-2xl ${colors[color]} transition-all shadow-md ${
                            themeColor === color
                              ? 'ring-4 ring-offset-2 ring-offset-background scale-110 shadow-lg'
                              : 'hover:scale-105'
                          }`}
                        >
                          {themeColor === color && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-6 w-6 bg-white rounded-full shadow-lg" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    선택한 색상이 앱의 강조 색상으로 적용됩니다
                  </p>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div>
                <h2 className="text-lg font-semibold mb-4">다크 모드</h2>
                <button
                  onClick={toggleTheme}
                  className="w-full bg-gradient-to-br from-background/60 to-muted/30 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isDarkMode ? (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Moon className="h-6 w-6 text-primary" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sun className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-semibold">다크 모드</p>
                        <p className="text-sm text-muted-foreground">
                          {isDarkMode ? '켜짐' : '꺼짐'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative w-14 h-7 rounded-full transition-colors shadow-inner ${
                        isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                          isDarkMode ? 'translate-x-7' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutDialog(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold mb-2">로그아웃</h3>
              <p className="text-sm text-muted-foreground mb-6">
                정말 로그아웃 하시겠습니까?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutDialog(false)}
                  className="flex-1 rounded-xl"
                >
                  취소
                </Button>
                <Button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700"
                >
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteDialog(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold mb-2 text-destructive">회원 탈퇴</h3>
              <p className="text-sm text-muted-foreground mb-6">
                계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 rounded-xl"
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    // TODO: Implement account deletion
                    setShowDeleteDialog(false)
                    alert('회원 탈퇴 기능은 준비 중입니다.')
                  }}
                  className="flex-1 rounded-xl"
                >
                  탈퇴
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
