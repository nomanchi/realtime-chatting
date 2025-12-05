import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Friend from '@/models/Friend'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)

    const { userId } = await req.json()

    // 입력 검증
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 자기 자신에게 친구 요청 불가
    if (userId === authUser.userId) {
      return NextResponse.json(
        { error: '자기 자신에게 친구 요청을 보낼 수 없습니다.' },
        { status: 400 }
      )
    }

    // 대상 사용자 존재 확인
    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 친구이거나 요청이 있는지 확인
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: authUser.userId, recipient: userId },
        { requester: userId, recipient: authUser.userId }
      ]
    })

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json(
          { error: '이미 친구입니다.' },
          { status: 400 }
        )
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json(
          { error: '이미 친구 요청이 있습니다.' },
          { status: 400 }
        )
      }
    }

    // 친구 요청 생성
    const friendship = await Friend.create({
      requester: authUser.userId,
      recipient: userId,
      status: 'pending'
    })

    return NextResponse.json(
      {
        success: true,
        friendship: {
          id: friendship._id,
          status: friendship.status,
          createdAt: friendship.createdAt
        },
        recipientId: userId  // Socket.IO 용
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('친구 요청 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '친구 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
