import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 인증이 필요한 경로
const protectedPaths = ['/friends', '/chatrooms', '/chat']

// 인증된 사용자가 접근하면 안 되는 경로 (로그인/회원가입)
const authPaths = ['/login', '/register', '/auth/login', '/auth/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 쿠키에서 토큰 확인
  const token = request.cookies.get('token')?.value

  // 보호된 경로에 접근 시 인증 체크
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  if (isProtectedPath && !token) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 사용자가 로그인/회원가입 페이지 접근 시 메인으로 리다이렉트
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/friends', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
