import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ChatRoom from '@/models/ChatRoom'
import User from '@/models/User'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

// POST /api/chatrooms/[id]/members - 채팅방에 멤버 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const authUser = await requireAuth(req)
    const { id: roomId } = await params
    const { memberIds } = await req.json()

    // 입력 검증
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: '추가할 멤버를 선택해주세요.' },
        { status: 400 }
      )
    }

    // 채팅방 조회
    const chatRoom: any = await ChatRoom.findById(roomId)

    if (!chatRoom) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 사용자가 채팅방 멤버인지 확인
    const isMember = chatRoom.members.some(
      (memberId: mongoose.Types.ObjectId) => memberId.toString() === authUser.userId
    )

    if (!isMember) {
      return NextResponse.json(
        { error: '이 채팅방의 멤버가 아닙니다.' },
        { status: 403 }
      )
    }

    // 새로운 멤버 ID를 ObjectId로 변환
    const newMemberObjectIds = memberIds.map(id => new mongoose.Types.ObjectId(id))

    // 이미 멤버인지 확인 (중복 방지)
    const existingMemberIds = chatRoom.members.map((m: mongoose.Types.ObjectId) => m.toString())
    const uniqueNewMembers = newMemberObjectIds.filter(
      (id: mongoose.Types.ObjectId) => !existingMemberIds.includes(id.toString())
    )

    if (uniqueNewMembers.length === 0) {
      return NextResponse.json(
        { error: '선택한 멤버가 이미 채팅방에 있습니다.' },
        { status: 400 }
      )
    }

    // 1:1 채팅인 경우 그룹 채팅으로 전환
    const updates: any = {
      $push: { members: { $each: uniqueNewMembers } }
    }

    if (chatRoom.type === 'direct') {
      updates.$set = { type: 'group' }
    }

    // 채팅방 업데이트
    await ChatRoom.findByIdAndUpdate(roomId, updates)

    // 새 멤버들의 User.chatRooms에 채팅방 추가
    await User.updateMany(
      { _id: { $in: uniqueNewMembers } },
      {
        $push: {
          chatRooms: {
            roomId: new mongoose.Types.ObjectId(roomId)
          }
        }
      }
    )

    // 업데이트된 채팅방 정보 조회
    const updatedChatRoom = await ChatRoom.findById(roomId)
      .populate('members', 'username email avatar')

    return NextResponse.json(
      {
        success: true,
        chatRoom: updatedChatRoom,
        addedMemberIds: uniqueNewMembers.map((id: mongoose.Types.ObjectId) => id.toString())
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('멤버 추가 오류:', error)

    if (error.message === '인증이 필요합니다.' || error.message === '유효하지 않은 토큰입니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '멤버 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
