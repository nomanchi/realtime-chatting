import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password: string
  username: string
  statusMessage?: string
  avatar?: string
  chatRooms: Array<{
    roomId: mongoose.Types.ObjectId
    customName?: string
    lastReadMessageId?: mongoose.Types.ObjectId
  }>
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, '이메일을 입력해주세요.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다.']
    },
    password: {
      type: String,
      required: [true, '비밀번호를 입력해주세요.'],
      minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
      select: false // 기본적으로 조회 시 비밀번호 제외
    },
    username: {
      type: String,
      required: [true, '사용자명을 입력해주세요.'],
      unique: true,
      trim: true,
      minlength: [2, '사용자명은 최소 2자 이상이어야 합니다.'],
      maxlength: [30, '사용자명은 최대 30자까지 가능합니다.']
    },
    statusMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, '상태 메시지는 최대 100자까지 가능합니다.']
    },
    avatar: {
      type: String,
      default: ''
    },
    chatRooms: {
      type: [{
        roomId: {
          type: Schema.Types.ObjectId,
          ref: 'ChatRoom',
          required: true
        },
        customName: {
          type: String,
          trim: true
        },
        lastReadMessageId: {
          type: Schema.Types.ObjectId,
          ref: 'Message'
        }
      }],
      default: []
    }
  },
  {
    timestamps: true
  }
)

// 비밀번호 해싱 미들웨어
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// 비밀번호 비교 메서드
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 모델이 이미 존재하면 재사용, 없으면 새로 생성
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User

