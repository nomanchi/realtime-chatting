import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChatRoom from '@/models/ChatRoom'
import Message from '@/models/Message'
import { requireAuth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params

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

    // 쿼리 파라미터
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // 메시지 ID (페이지네이션)

    // 메시지 조회 쿼리
    const query: any = { chatRoom: roomId }
    if (before) {
      const beforeMessage = await Message.findById(before)
      if (beforeMessage) {
        query.timestamp = { $lt: beforeMessage.timestamp }
      }
    }

    // 메시지 조회
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('senderId', 'username avatar')

    // 모든 멤버의 lastReadMessageId 조회
    const User = (await import('@/models/User')).default
    let members: any[] = []

    try {
      members = await User.find({
        _id: { $in: chatRoom.members }
      }).select('chatRooms')
    } catch (error) {
      console.error('멤버 조회 오류:', error)
      // 멤버 조회 실패해도 메시지는 반환
    }

    // 메시지별 읽지 않은 멤버 수 계산
    const messagesWithUnreadCount = messages.map((message: any) => {
      const messageObj = message.toObject()

      // 이 메시지를 읽지 않은 멤버 수 계산
      let unreadCount = 0

      if (members.length > 0) {
        members.forEach((member: any) => {
          // 본인이 보낸 메시지는 카운트 안 함
          if (member._id.toString() === messageObj.senderId._id.toString()) {
            return
          }

          const memberChatRoom = member.chatRooms?.find(
            (cr: any) => cr.roomId.toString() === roomId.toString()
          )

          const lastReadMessageId = memberChatRoom?.lastReadMessageId

          // lastReadMessageId가 없으면 읽지 않음
          if (!lastReadMessageId) {
            unreadCount++
            return
          }

          // lastReadMessageId와 현재 메시지 ID를 비교 (ObjectId 비교)
          // ObjectId는 timestamp를 포함하므로 getTimestamp()로 비교
          const lastReadTimestamp = lastReadMessageId.getTimestamp()
          const currentTimestamp = messageObj._id.getTimestamp()

          // 현재 메시지가 lastRead보다 나중에 생성되었으면 읽지 않음
          if (currentTimestamp > lastReadTimestamp) {
            unreadCount++
          }
        })
      }

      return {
        ...messageObj,
        unreadCount
      }
    })

    // 시간 순으로 정렬 (최신 메시지가 마지막)
    const sortedMessages = messagesWithUnreadCount.reverse()

    return NextResponse.json(
      {
        messages: sortedMessages,
        hasMore: messages.length === limit
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('메시지 조회 오류:', error)
    console.error('Error stack:', error.stack)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '메시지 조회 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

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
    const message: any = await Message.create({
      chatRoom: roomId,
      senderId: authUser.userId,
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
        message,
        roomId: roomId.toString(),
        memberIds: chatRoom.members.map((m: any) => m.toString())  // Socket.IO 용
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('메시지 전송 오류:', error)
    console.error('Error stack:', error.stack)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '메시지 전송 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
