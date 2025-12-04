import { create } from 'zustand'
import { Message, User, ConnectionStatus } from '@/types/chat'

interface ChatState {
  messages: Message[]
  currentUser: User | null
  onlineUsers: User[]
  connectionStatus: ConnectionStatus
  typingUsers: Set<string>

  // Actions
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setCurrentUser: (user: User) => void
  setOnlineUsers: (users: User[]) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  clearTypingUsers: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentUser: null,
  onlineUsers: [],
  connectionStatus: 'disconnected',
  typingUsers: new Set(),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),

  setMessages: (messages) =>
    set({ messages }),

  setCurrentUser: (user) =>
    set({ currentUser: user }),

  setOnlineUsers: (users) =>
    set({ onlineUsers: users }),

  setConnectionStatus: (status) =>
    set({ connectionStatus: status }),

  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: new Set([...state.typingUsers, userId])
    })),

  removeTypingUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.typingUsers)
      newSet.delete(userId)
      return { typingUsers: newSet }
    }),

  clearTypingUsers: () =>
    set({ typingUsers: new Set() })
}))
