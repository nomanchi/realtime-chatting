import { createServer } from 'node:http'
import next from 'next'
import { Server } from 'socket.io'
import type { Message } from './src/types/chat'

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

const connectedUsers = new Map<string, User>()
const messages: Message[] = []

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Handle user join
    socket.on('user:join', (userName: string) => {
      const user: User = {
        id: socket.id,
        name: userName,
        socketId: socket.id
      }

      connectedUsers.set(socket.id, user)

      // Send message history to new user
      socket.emit('messages:history', messages)

      // Broadcast updated user list to ALL users (including new user)
      io.emit('users:list', Array.from(connectedUsers.values()))

      console.log(`${userName} joined. Total users: ${connectedUsers.size}`)
    })

    // Handle message (including images)
    socket.on('message:send', (message: Omit<Message, 'id' | 'timestamp'>) => {
      const fullMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${socket.id}`,
        timestamp: Date.now(),
        status: 'sent'
      }

      // Store message (including imageData if present)
      messages.push(fullMessage)

      // Broadcast to all users including sender
      io.emit('message:received', fullMessage)

      const contentPreview = message.imageData ? '[이미지]' : message.content
      console.log(`Message from ${message.senderName}: ${contentPreview}`)
    })

    // Handle typing indicator
    socket.on('user:typing', (userName: string) => {
      socket.broadcast.emit('user:typing', { userId: socket.id, userName })
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
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running`)
    })
})
