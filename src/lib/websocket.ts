import { Message } from '@/types/chat'
import { useChatStore } from '@/store/chat-store'

type MessageHandler = (message: Message) => void
type StatusHandler = (status: string) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private messageHandlers: MessageHandler[] = []
  private statusHandlers: StatusHandler[] = []
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  // Mock mode for demo
  private mockMode = true
  private mockInterval: NodeJS.Timeout | null = null

  connect(url?: string) {
    if (this.mockMode) {
      this.connectMock()
      return
    }

    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(url || 'ws://localhost:8080')

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.notifyStatus('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data)
          this.notifyMessage(message)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.notifyStatus('error')
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.notifyStatus('disconnected')
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      this.notifyStatus('error')
    }
  }

  private connectMock() {
    console.log('Mock WebSocket connected')
    this.notifyStatus('connected')

    // Simulate receiving messages
    const mockMessages = [
      { senderId: 'user-2', senderName: '김철수', content: '안녕하세요!' },
      { senderId: 'user-3', senderName: '박영희', content: '반갑습니다~' },
    ]

    let messageIndex = 0
    this.mockInterval = setInterval(() => {
      if (messageIndex < mockMessages.length) {
        const mock = mockMessages[messageIndex]
        this.notifyMessage({
          id: `msg-${Date.now()}-${messageIndex}`,
          ...mock,
          timestamp: Date.now(),
          status: 'sent'
        })
        messageIndex++
      }
    }, 3000)
  }

  disconnect() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval)
      this.mockInterval = null
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  sendMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const fullMessage: Message = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: Date.now(),
      status: 'sent'
    }

    if (this.mockMode || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // In mock mode or disconnected, just notify locally
      this.notifyMessage(fullMessage)
      return
    }

    try {
      this.ws.send(JSON.stringify(fullMessage))
    } catch (error) {
      console.error('Failed to send message:', error)
    }
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

  private notifyMessage(message: Message) {
    this.messageHandlers.forEach(handler => handler(message))
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(handler => handler(status))
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`)
      this.connect()
    }, delay)
  }
}

export const wsManager = new WebSocketManager()
