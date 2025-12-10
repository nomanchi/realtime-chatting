import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

// DELETE /api/chatrooms/:id/leave - 채팅방 나가기
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params

    // User.chatRooms에서 해당 채팅방 제거
    const result = await User.updateOne(
      { _id: authUser.userId },
      { $pull: { chatRooms: { roomId: roomId } } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, message: '채팅방에서 나갔습니다.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('채팅방 나가기 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '채팅방 나가기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
