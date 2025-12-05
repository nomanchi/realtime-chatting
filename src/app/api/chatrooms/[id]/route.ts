import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChatRoom from '@/models/ChatRoom'
import { requireAuth } from '@/lib/auth'

// GET /api/chatrooms/[id] - 채팅방 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params

    const chatRoom: any = await ChatRoom.findById(roomId)
      .populate('members', 'username email avatar')

    if (!chatRoom) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 멤버 권한 확인
    const isMember = chatRoom.members.some(
      (m: any) => m._id.toString() === authUser.userId
    )

    if (!isMember) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { chatRoom },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('채팅방 조회 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '채팅방 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
