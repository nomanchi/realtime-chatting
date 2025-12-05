import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, JWTPayload } from './jwt'

/**
 * 요청에서 인증 토큰 추출 (쿠키 우선)
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  // 1순위: 쿠키에서 토큰 추출
  const token = req.cookies.get('token')?.value
  if (token) {
    return token
  }

  // 2순위: Authorization 헤더에서 토큰 추출 (하위 호환성)
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * 서버 컴포넌트에서 쿠키로부터 토큰 가져오기
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token || null
}

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies()
  if (!token) {
    return null
  }

  return verifyToken(token)
}

/**
 * API Route에서 인증 확인
 */
export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const token = getTokenFromRequest(req)

  if (!token) {
    throw new Error('인증이 필요합니다.')
  }

  const user = verifyToken(token)

  if (!user) {
    throw new Error('유효하지 않은 토큰입니다.')
  }

  return user
}
