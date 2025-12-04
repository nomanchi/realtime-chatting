import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: '로그아웃되었습니다.' },
      { status: 200 }
    )

    // 쿠키에서 토큰 삭제
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 즉시 만료
    })

    return response
  } catch (error: any) {
    console.error('로그아웃 오류:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

