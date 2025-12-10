export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  status?: 'sending' | 'sent' | 'failed'
  imageUrl?: string
  imageData?: string  // base64 encoded image
  unreadCount?: number
}

export interface User {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
