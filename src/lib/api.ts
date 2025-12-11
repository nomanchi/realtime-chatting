import { useAuthStore } from '@/store/auth-store'

interface RegisterData {
  email: string
  password: string
  username: string
}

interface LoginData {
  email: string
  password: string
}

interface AuthResponse {
  success: boolean
  user: {
    id: string
    email: string
    username: string
    avatar?: string
  }
  token: string
}

/**
 * 회원가입
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회원가입에 실패했습니다.')
  }

  return response.json()
}

/**
 * 로그인
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '로그인에 실패했습니다.')
  }

  return response.json()
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  const response = await fetch(`/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('로그아웃에 실패했습니다.')
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<any> {
  const token = useAuthStore.getState().token

  const response = await fetch(`/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('사용자 정보를 가져오는데 실패했습니다.')
  }

  return response.json()
}

