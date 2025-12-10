'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPlatform } from '@/lib/platform'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    // 인증된 사용자는 자동으로 채팅으로 이동
    if (isAuthenticated) {
      const platform = getPlatform()
      router.push(`/${platform}`)
    }
  }, [isAuthenticated, router])

  // 인증되지 않은 사용자에게 랜딩 페이지 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            실시간 채팅
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            빠르고 안전한 실시간 메시징 플랫폼
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/login">
              <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-indigo-600 hover:bg-indigo-700">
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-purple-600 hover:bg-purple-700">
                회원가입
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">실시간 메시징</h3>
              <p className="text-gray-600 text-sm">Socket.io 기반 초저지연 실시간 채팅</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold text-lg mb-2">안전한 인증</h3>
              <p className="text-gray-600 text-sm">JWT 기반 보안 인증 시스템</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-semibold text-lg mb-2">크로스 플랫폼</h3>
              <p className="text-gray-600 text-sm">웹, 모바일 모두 지원</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">플랫폼 감지 중...</p>
      </div>
    </div>
  )
}
