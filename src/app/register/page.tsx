'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { register } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const { login: setAuth } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        username: formData.username
      })
      setAuth(response.user, response.token)
      router.push('/browser')
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">새 계정을 만드세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <Input
                id="username"
                type="text"
                placeholder="사용자명"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={2}
                maxLength={30}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                로그인
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/browser" className="text-sm text-gray-500 hover:text-gray-700">
              익명으로 계속하기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

