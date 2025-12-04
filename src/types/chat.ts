export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: number
  status?: 'sending' | 'sent' | 'failed'
}

export interface User {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
