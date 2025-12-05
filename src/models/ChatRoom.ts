import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IChatRoom extends Document {
  _id: mongoose.Types.ObjectId
  name?: string  // 그룹 채팅의 기본 이름 (생성 시 설정)
  type: 'direct' | 'group'
  members: mongoose.Types.ObjectId[]
  lastMessage?: string
  lastMessageAt?: Date
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  getOtherMember(userId: mongoose.Types.ObjectId): mongoose.Types.ObjectId | null
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    name: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      type: String
    },
    lastMessageAt: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

// 멤버별 채팅방 조회를 위한 인덱스
ChatRoomSchema.index({ members: 1 })

// 마지막 메시지 시간 순 정렬을 위한 인덱스
ChatRoomSchema.index({ lastMessageAt: -1 })

// 1:1 채팅방 중복 방지를 위한 메서드
ChatRoomSchema.statics.findDirectChatRoom = async function(
  userId1: mongoose.Types.ObjectId,
  userId2: mongoose.Types.ObjectId
) {
  return this.findOne({
    type: 'direct',
    members: { $all: [userId1, userId2], $size: 2 }
  })
}

// 1:1 채팅에서 상대방 ID 가져오기
ChatRoomSchema.methods.getOtherMember = function(
  userId: mongoose.Types.ObjectId
): mongoose.Types.ObjectId | null {
  if (this.type !== 'direct' || this.members.length !== 2) {
    return null
  }

  const otherMember = this.members.find(
    (memberId: mongoose.Types.ObjectId) => !memberId.equals(userId)
  )

  return otherMember || null
}

const ChatRoom: Model<IChatRoom> =
  mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema)

export default ChatRoom
