import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)

    // 사용자 정보 조회
    const user = await User.findById(authUser.userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('사용자 정보 조회 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '사용자 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

