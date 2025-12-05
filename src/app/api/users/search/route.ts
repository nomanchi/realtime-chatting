import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Friend from '@/models/Friend'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)

    // 쿼리 파라미터에서 검색어 가져오기
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { users: [] },
        { status: 200 }
      )
    }

    // 사용자 검색 (username 또는 email)
    const users = await User.find({
      $and: [
        {
          _id: { $ne: authUser.userId } // 자기 자신 제외
        },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).limit(20)

    // 각 사용자와의 친구 관계 확인
    const userIds = users.map(user => user._id)
    const friendships = await Friend.find({
      $or: [
        { requester: authUser.userId, recipient: { $in: userIds } },
        { recipient: authUser.userId, requester: { $in: userIds } }
      ]
    })

    // 친구 관계 맵 생성
    const friendshipMap = new Map()
    friendships.forEach(friendship => {
      const otherUserId = friendship.requester.toString() === authUser.userId
        ? friendship.recipient.toString()
        : friendship.requester.toString()
      friendshipMap.set(otherUserId, friendship)
    })

    // 응답 데이터 생성
    const usersWithFriendStatus = users.map(user => {
      const friendship = friendshipMap.get(user._id.toString())
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        friendshipStatus: friendship ? friendship.status : null,
        friendshipId: friendship ? friendship._id : null
      }
    })

    return NextResponse.json(
      { users: usersWithFriendStatus },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('사용자 검색 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '사용자 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
