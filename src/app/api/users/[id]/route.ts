import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/users/:id - 특정 사용자 프로필 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    jwt.verify(token, JWT_SECRET) // 토큰 검증만 수행

    await connectDB()

    const user = await User.findById(params.id).select('-password')
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        statusMessage: user.statusMessage || '',
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error)
    return NextResponse.json({ error: '프로필 조회 실패' }, { status: 500 })
  }
}
