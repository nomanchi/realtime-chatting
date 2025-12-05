import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Friend from '@/models/Friend'
import { requireAuth } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)
    const { id: friendshipId } = await params

    // 친구 요청 조회
    const friendship = await Friend.findById(friendshipId)

    if (!friendship) {
      return NextResponse.json(
        { error: '친구 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청 받은 사람만 수락할 수 있음
    if (friendship.recipient.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: '이 친구 요청을 수락할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 수락된 요청인지 확인
    if (friendship.status === 'accepted') {
      return NextResponse.json(
        { error: '이미 수락된 친구 요청입니다.' },
        { status: 400 }
      )
    }

    // 친구 요청 수락
    friendship.status = 'accepted'
    await friendship.save()

    return NextResponse.json(
      {
        success: true,
        friendship: {
          id: friendship._id,
          status: friendship.status
        },
        requesterId: friendship.requester.toString()  // Socket.IO 용
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('친구 수락 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '친구 수락 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
