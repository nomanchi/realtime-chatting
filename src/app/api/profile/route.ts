import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/profile - 현재 사용자 프로필 조회
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    await connectDB()

    const user = await User.findById(decoded.userId).select('-password')
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
    console.error('프로필 조회 오류:', error)
    return NextResponse.json({ error: '프로필 조회 실패' }, { status: 500 })
  }
}

// PATCH /api/profile - 현재 사용자 프로필 수정
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const body = await req.json()
    const { username, statusMessage, avatar } = body

    await connectDB()

    const updateData: { username?: string; statusMessage?: string; avatar?: string } = {}
    if (username !== undefined) updateData.username = username
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      message: '프로필이 업데이트되었습니다',
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        statusMessage: user.statusMessage || '',
        avatar: user.avatar
      }
    })
  } catch (error: any) {
    console.error('프로필 수정 오류:', error)

    // 중복 사용자명 에러 처리
    if (error.code === 11000) {
      return NextResponse.json({ error: '이미 사용중인 사용자명입니다' }, { status: 400 })
    }

    // Validation 에러 처리
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      return NextResponse.json({ error: messages[0] }, { status: 400 })
    }

    return NextResponse.json({ error: '프로필 수정 실패' }, { status: 500 })
  }
}
