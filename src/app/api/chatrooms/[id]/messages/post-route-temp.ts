import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChatRoom from '@/models/ChatRoom'
import Message from '@/models/Message'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

// POST /api/chatrooms/[id]/messages - 메시지 전송
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params
    const { content, imageData } = await req.json()

    // 입력 검증
    if (!content && !imageData) {
      return NextResponse.json(
        { error: '메시지 내용 또는 이미지가 필요합니다.' },
        { status: 400 }
      )
    }

    // 채팅방 조회
    const chatRoom = await ChatRoom.findById(roomId)

    if (!chatRoom) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 멤버 권한 확인
    const isMember = chatRoom.members.some(
      (memberId) => memberId.toString() === authUser.userId
    )

    if (!isMember) {
      return NextResponse.json(
        { error: '이 채팅방에 접근할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 메시지 생성
    const message = await Message.create({
      chatRoom: new mongoose.Types.ObjectId(roomId),
      senderId: new mongoose.Types.ObjectId(authUser.userId),
      senderName: authUser.username,
      content: content || '',
      imageData: imageData || undefined,
      timestamp: Date.now(),
      status: 'sent'
    })

    // 채팅방 마지막 메시지 업데이트
    chatRoom.lastMessage = content || '이미지'
    chatRoom.lastMessageAt = new Date()
    await chatRoom.save()

    // 메시지 populate해서 반환
    await message.populate('senderId', 'username avatar')

    return NextResponse.json(
      {
        success: true,
        message
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('메시지 전송 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '메시지 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
