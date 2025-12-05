import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params
    const { name } = await req.json()

    // 입력 검증
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '채팅방 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 채팅방 이름 업데이트 (User.chatRooms의 customName 업데이트)
    const result = await User.updateOne(
      {
        _id: authUser.userId,
        'chatRooms.roomId': roomId
      },
      {
        $set: {
          'chatRooms.$.customName': name.trim()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        name: name.trim()
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('채팅방 이름 수정 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '채팅방 이름 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
