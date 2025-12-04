// 환경 변수를 가장 먼저 로드 (다른 모듈들이 import되기 전)
import dotenv from 'dotenv'
import { resolve } from 'path'

// .env.local과 .env 파일 모두 로드 시도
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

console.log('🔍 환경 변수 파일 로드 시도...')
console.log('   .env.local 경로:', envLocalPath)
console.log('   .env 경로:', envPath)

const result1 = dotenv.config({ path: envLocalPath })
const result2 = dotenv.config({ path: envPath })

if (result1.error && result2.error) {
  console.log('⚠️  환경 변수 파일을 찾을 수 없습니다.')
} else {
  console.log('✅ 환경 변수 로드 완료')
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '없음')
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '설정됨' : '없음')
}

import { createServer } from 'node:http'
import next from 'next'
import { Server, Socket } from 'socket.io'
import type { Message } from './src/types/chat'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import connectDB from './src/lib/mongodb'
import MessageModel from './src/models/Message'
import { JWTPayload } from './src/lib/jwt'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 4001

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

interface User {
  id: string
  name: string
  socketId: string
}

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
  username?: string
}

const connectedUsers = new Map<string, User>()

// JWT 검증 함수
function verifySocketToken(token: string): JWTPayload | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

async function startServer(currentPort: number) {
  // MongoDB 연결
  await connectDB()

  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Socket.io 인증 미들웨어
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      // 토큰이 없으면 익명 사용자로 처리 (기존 동작 유지)
      return next()
    }

    const decoded = verifySocketToken(token)
    if (decoded) {
      socket.userId = decoded.userId
      socket.userEmail = decoded.email
      socket.username = decoded.username
      console.log(`✅ 인증된 사용자 연결: ${decoded.username}`)
    }

    next()
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('User connected:', socket.id)

    // Handle user join
    socket.on('user:join', async (userName: string) => {
      const user: User = {
        id: socket.userId || socket.id,
        name: socket.username || userName,
        socketId: socket.id
      }

      connectedUsers.set(socket.id, user)

      try {
        // DB에서 메시지 히스토리 로드 (최근 100개)
        const dbMessages = await MessageModel.find()
          .sort({ timestamp: -1 })
          .limit(100)
          .lean()

        // DB 메시지를 클라이언트 형식으로 변환
        const formattedMessages: Message[] = dbMessages.reverse().map((msg) => ({
          id: msg._id.toString(),
          content: msg.content,
          senderId: msg.senderId.toString(),
          senderName: msg.senderName,
          imageData: msg.imageData,
          timestamp: msg.timestamp,
          status: 'sent' as const
        }))

        // Send message history to new user
        socket.emit('messages:history', formattedMessages)
      } catch (error) {
        console.error('메시지 히스토리 로드 오류:', error)
        socket.emit('messages:history', [])
      }

      // Broadcast updated user list to ALL users (including new user)
      io.emit('users:list', Array.from(connectedUsers.values()))

      console.log(`${user.name} joined. Total users: ${connectedUsers.size}`)
    })

    // Handle message (including images)
    socket.on('message:send', async (message: Omit<Message, 'id' | 'timestamp'>) => {
      try {
        // 인증된 사용자인 경우 DB에 저장
        if (socket.userId) {
          const dbMessage = await MessageModel.create({
            content: message.content,
            senderId: new mongoose.Types.ObjectId(socket.userId),
            senderName: socket.username || message.senderName,
            imageData: message.imageData,
            timestamp: Date.now(),
            status: 'sent'
          })

          const fullMessage: Message = {
            id: dbMessage._id.toString(),
            content: dbMessage.content,
            senderId: dbMessage.senderId.toString(),
            senderName: dbMessage.senderName,
            imageData: dbMessage.imageData,
            timestamp: dbMessage.timestamp,
            status: 'sent'
          }

          // Broadcast to all users including sender
          io.emit('message:received', fullMessage)

          const contentPreview = message.imageData ? '[이미지]' : message.content
          console.log(`💬 Message from ${socket.username}: ${contentPreview}`)
        } else {
          // 익명 사용자는 메모리에만 저장 (기존 동작)
          const fullMessage: Message = {
            ...message,
            id: `msg-${Date.now()}-${socket.id}`,
            timestamp: Date.now(),
            status: 'sent'
          }

          io.emit('message:received', fullMessage)
          console.log(`💬 Anonymous message from ${message.senderName}: ${message.content}`)
        }
      } catch (error) {
        console.error('메시지 저장 오류:', error)
        socket.emit('error', { message: '메시지 전송에 실패했습니다.' })
      }
    })

    // Handle typing indicator
    socket.on('user:typing', (userName: string) => {
      socket.broadcast.emit('user:typing', { userId: socket.id, userName: socket.username || userName })
    })

    socket.on('user:stop-typing', () => {
      socket.broadcast.emit('user:stop-typing', socket.id)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id)
      if (user) {
        connectedUsers.delete(socket.id)
        // Broadcast updated user list to all remaining users
        io.emit('users:list', Array.from(connectedUsers.values()))
        console.log(`${user.name} left. Total users: ${connectedUsers.size}`)
      }
    })
  })

  httpServer
    .once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`포트 ${currentPort}이(가) 사용 중입니다. 다음 포트로 시도합니다...`)
        startServer(currentPort + 1)
      } else {
        console.error(err)
        process.exit(1)
      }
    })
    .listen(currentPort, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`)
      console.log(`> Socket.io server running`)
    })
}

app.prepare().then(() => {
  startServer(port)
})
