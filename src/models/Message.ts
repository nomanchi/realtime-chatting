import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  content: string
  senderId: mongoose.Types.ObjectId
  senderName: string
  chatRoom: mongoose.Types.ObjectId
  imageData?: string
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: [true, '메시지 내용을 입력해주세요.'],
      trim: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '발신자 ID가 필요합니다.']
    },
    senderName: {
      type: String,
      required: [true, '발신자 이름이 필요합니다.']
    },
    chatRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: [true, '채팅방 ID가 필요합니다.']
    },
    imageData: {
      type: String,
      default: undefined
    },
    timestamp: {
      type: Number,
      required: true,
      default: () => Date.now()
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  },
  {
    timestamps: true
  }
)

// 인덱스 생성 (조회 성능 향상)
MessageSchema.index({ timestamp: -1 })
MessageSchema.index({ senderId: 1 })
MessageSchema.index({ chatRoom: 1, timestamp: -1 }) // 채팅방별 메시지 조회

// 모델이 이미 존재하면 재사용, 없으면 새로 생성
const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)

export default Message

