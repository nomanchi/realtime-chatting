import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'

// PATCH /api/chatrooms/[id]/read - 메시지 읽음 처리
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params
    const { messageId } = await req.json()

    // messageId가 없으면 해당 채팅방의 가장 최신 메시지로 설정
    let lastReadMessageId = messageId

    if (!lastReadMessageId) {
      // 채팅방의 마지막 메시지 조회
      const Message = (await import('@/models/Message')).default
      const lastMessage = await Message.findOne({ chatRoom: roomId })
        .sort({ timestamp: -1 })
        .select('_id')

      lastReadMessageId = lastMessage?._id
    }

    if (!lastReadMessageId) {
      return NextResponse.json(
        { error: '읽을 메시지가 없습니다.' },
        { status: 400 }
      )
    }

    // ChatRoom 조회 (memberIds를 위해)
    const ChatRoom = (await import('@/models/ChatRoom')).default
    const chatRoom = await ChatRoom.findById(roomId).select('members')

    if (!chatRoom) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // User.chatRooms의 lastReadMessageId 업데이트
    const result = await User.updateOne(
      {
        _id: authUser.userId,
        'chatRooms.roomId': roomId
      },
      {
        $set: {
          'chatRooms.$.lastReadMessageId': lastReadMessageId
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        lastReadMessageId,
        roomId: roomId.toString(),
        memberIds: chatRoom.members.map((m: any) => m.toString())
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('메시지 읽음 처리 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '메시지 읽음 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
