import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFriend extends Document {
  _id: mongoose.Types.ObjectId
  requester: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const FriendSchema = new Schema<IFriend>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
)

// 복합 인덱스: 같은 두 사용자 간의 중복 요청 방지
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true })

// 상태별 조회를 위한 인덱스
FriendSchema.index({ status: 1 })

// 특정 사용자의 친구 관계를 빠르게 조회하기 위한 인덱스
FriendSchema.index({ requester: 1, status: 1 })
FriendSchema.index({ recipient: 1, status: 1 })

const Friend: Model<IFriend> =
  mongoose.models.Friend || mongoose.model<IFriend>('Friend', FriendSchema)

export default Friend
