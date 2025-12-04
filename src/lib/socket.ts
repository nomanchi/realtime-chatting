import { io, Socket } from 'socket.io-client'
import { Message } from '@/types/chat'

type MessageHandler = (message: Message) => void
type StatusHandler = (status: string) => void
type UsersHandler = (users: any[]) => void

class SocketManager {
  private socket: Socket | null = null
  private messageHandlers: MessageHandler[] = []
  private statusHandlers: StatusHandler[] = []
  private usersHandlers: UsersHandler[] = []
  private currentUserName: string = ''

  connect(userName: string, token?: string) {
    if (this.socket?.connected) return

    this.currentUserName = userName

    // Get server URL from current location (supports localhost and network access)
    const serverUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4001`
      : 'http://localhost:4001'

    // Connect to Socket.io server with optional authentication
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined
    })

    this.socket.on('connect', () => {
      console.log('Socket.io connected')
      this.notifyStatus('connected')

      // Join with user name
      this.socket?.emit('user:join', userName)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected')
      this.notifyStatus('disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.notifyStatus('error')
    })

    // Listen for messages
    this.socket.on('message:received', (message: Message) => {
      this.notifyMessage(message)
    })

    // Listen for message history
    this.socket.on('messages:history', (messages: Message[]) => {
      messages.forEach(msg => this.notifyMessage(msg))
    })

    // Listen for users list
    this.socket.on('users:list', (users: any[]) => {
      this.notifyUsers(users)
    })

    // User list updates are handled by 'users:list' event
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  sendMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    if (!this.socket?.connected) {
      console.error('Socket not connected')
      return
    }

    this.socket.emit('message:send', message)
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler)
    }
  }

  onUsers(handler: UsersHandler) {
    this.usersHandlers.push(handler)
    return () => {
      this.usersHandlers = this.usersHandlers.filter(h => h !== handler)
    }
  }

  private notifyMessage(message: Message) {
    this.messageHandlers.forEach(handler => handler(message))
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(handler => handler(status))
  }

  private notifyUsers(users: any[]) {
    this.usersHandlers.forEach(handler => handler(users))
  }
}

export const socketManager = new SocketManager()
