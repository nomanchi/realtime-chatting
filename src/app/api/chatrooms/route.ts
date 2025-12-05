import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChatRoom from '@/models/ChatRoom'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

// GET /api/chatrooms - 채팅방 목록 조회
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)

    // 현재 사용자 조회 (chatRooms 포함)
    const user: any = await User.findById(authUser.userId).select('chatRooms')

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자의 채팅방 ID 목록
    const roomIds = user.chatRooms.map((cr: any) => cr.roomId)

    // 채팅방 정보 조회
    const chatRooms = await ChatRoom.find({
      _id: { $in: roomIds }
    })
      .populate('members', 'username email avatar')
      .sort({ lastMessageAt: -1 })

    // Message 모델 import
    const Message = (await import('@/models/Message')).default

    // 각 채팅방에 customName과 unreadCount 추가
    const chatRoomsWithDetails = await Promise.all(chatRooms.map(async (room: any) => {
      const roomObj = room.toObject()

      // User.chatRooms에서 customName과 lastReadMessageId 찾기
      const userChatRoom = user.chatRooms.find(
        (cr: any) => cr.roomId.toString() === room._id.toString()
      )
      const customName = userChatRoom?.customName
      const lastReadMessageId = userChatRoom?.lastReadMessageId

      // 읽지 않은 메시지 개수 계산
      let unreadCount = 0
      if (lastReadMessageId) {
        unreadCount = await Message.countDocuments({
          chatRoom: room._id,
          _id: { $gt: lastReadMessageId },
          senderId: { $ne: authUser.userId }  // 내가 보낸 메시지 제외
        })
      } else {
        // lastReadMessageId가 없으면 모든 메시지가 읽지 않음
        unreadCount = await Message.countDocuments({
          chatRoom: room._id,
          senderId: { $ne: authUser.userId }
        })
      }

      // 1:1 채팅인 경우 상대방 정보 추가
      if (room.type === 'direct') {
        const otherMemberId = room.getOtherMember(new mongoose.Types.ObjectId(authUser.userId))
        const otherMember = room.members.find(
          (m: any) => m._id.toString() === otherMemberId?.toString()
        )

        return {
          ...roomObj,
          customName,
          unreadCount,
          otherMember: otherMember ? {
            id: otherMember._id,
            username: otherMember.username,
            email: otherMember.email,
            avatar: otherMember.avatar
          } : null
        }
      }

      return {
        ...roomObj,
        customName,
        unreadCount
      }
    }))

    return NextResponse.json(
      { chatRooms: chatRoomsWithDetails },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('채팅방 목록 조회 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '채팅방 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/chatrooms - 채팅방 생성
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // 인증 확인
    const authUser = await requireAuth(req)

    const { type, memberId, memberIds, name } = await req.json()

    // 입력 검증
    if (!type || (type !== 'direct' && type !== 'group')) {
      return NextResponse.json(
        { error: '채팅방 타입을 입력해주세요. (direct 또는 group)' },
        { status: 400 }
      )
    }

    let members: string[] = []

    if (type === 'direct') {
      // 1:1 채팅
      if (!memberId) {
        return NextResponse.json(
          { error: '채팅 상대를 선택해주세요.' },
          { status: 400 }
        )
      }

      // 이미 존재하는 1:1 채팅방 확인
      const existingRoom = await (ChatRoom as any).findDirectChatRoom(
        new mongoose.Types.ObjectId(authUser.userId),
        new mongoose.Types.ObjectId(memberId)
      )

      if (existingRoom) {
        return NextResponse.json(
          {
            success: true,
            chatRoom: existingRoom,
            isNew: false
          },
          { status: 200 }
        )
      }

      members = [authUser.userId, memberId]
    } else {
      // 그룹 채팅
      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return NextResponse.json(
          { error: '채팅 멤버를 선택해주세요.' },
          { status: 400 }
        )
      }

      members = [authUser.userId, ...memberIds]
    }

    // 채팅방 생성
    const chatRoom = await ChatRoom.create({
      type,
      name: type === 'group' ? name : undefined,
      members: members.map(id => new mongoose.Types.ObjectId(id)),
      createdBy: new mongoose.Types.ObjectId(authUser.userId)
    })

    // 모든 멤버의 User.chatRooms에 추가
    await User.updateMany(
      { _id: { $in: members.map(id => new mongoose.Types.ObjectId(id)) } },
      {
        $push: {
          chatRooms: {
            roomId: chatRoom._id
          }
        }
      }
    )

    // 멤버 정보 populate
    await chatRoom.populate('members', 'username email avatar')

    return NextResponse.json(
      {
        success: true,
        chatRoom,
        isNew: true
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('채팅방 생성 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '채팅방 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
