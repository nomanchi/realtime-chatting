'use client'

import { useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'

interface ChatHeaderProps {
  title?: string
  className?: string
}

export function ChatHeader({ title = '실시간 채팅', className }: ChatHeaderProps) {
  const { onlineUsers, connectionStatus } = useChatStore()

  const statusConfig = {
    connected: { icon: Wifi, text: '연결됨', color: 'text-green-500' },
    connecting: { icon: Wifi, text: '연결 중...', color: 'text-yellow-500' },
    disconnected: { icon: WifiOff, text: '연결 끊김', color: 'text-red-500' },
    error: { icon: WifiOff, text: '오류', color: 'text-red-500' },
  }

  const status = statusConfig[connectionStatus]
  const StatusIcon = status.icon

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 border-b bg-background",
      className
    )}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-semibold text-lg">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {onlineUsers.length}명 접속 중
          </p>
        </div>
      </div>

      <div className={cn("flex items-center gap-1.5", status.color)}>
        <StatusIcon className="h-4 w-4" />
        <span className="text-xs font-medium">{status.text}</span>
      </div>
    </div>
  )
}
