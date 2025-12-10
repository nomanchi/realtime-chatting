import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Friend from '@/models/Friend'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

// GET /api/friends - 친구 목록 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)

    // 쿼리 파라미터에서 상태 가져오기 (기본값: accepted)
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'accepted'

    // 친구 관계 조회
    const friendships = await Friend.find({
      $or: [
        { requester: authUser.userId, status },
        { recipient: authUser.userId, status }
      ]
    }).populate('requester recipient', 'username email avatar statusMessage')

    // 친구 목록 생성
    const friends = friendships.map((friendship: any) => {
      const isRequester = friendship.requester._id.toString() === authUser.userId
      const friend = isRequester ? friendship.recipient : friendship.requester

      return {
        id: friend._id,
        username: friend.username,
        email: friend.email,
        avatar: friend.avatar,
        statusMessage: friend.statusMessage,
        friendshipId: friendship._id,
        friendshipStatus: friendship.status,
        isRequester: isRequester,
        createdAt: friendship.createdAt
      }
    })

    return NextResponse.json(
      { friends },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('친구 목록 조회 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '친구 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
