'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'
import { Popover } from '@/components/ui/popover'
import { Avatar } from '@/components/ui/avatar'

interface ChatHeaderProps {
  title?: string
  className?: string
  showUserListPopover?: boolean
}

export function ChatHeader({ title = '실시간 채팅', className, showUserListPopover = false }: ChatHeaderProps) {
  const { onlineUsers, connectionStatus } = useChatStore()
  const [userListOpen, setUserListOpen] = useState(false)

  const statusConfig = {
    connected: { icon: Wifi, text: '연결됨', color: 'text-green-500' },
    connecting: { icon: Wifi, text: '연결 중...', color: 'text-yellow-500' },
    disconnected: { icon: WifiOff, text: '연결 끊김', color: 'text-red-500' },
    error: { icon: WifiOff, text: '오류', color: 'text-red-500' },
  }

  const status = statusConfig[connectionStatus]
  const StatusIcon = status.icon

  const userCountElement = (
    <p className={cn(
      "text-xs text-muted-foreground",
      showUserListPopover && "cursor-pointer hover:text-foreground transition-colors"
    )}>
      {onlineUsers.length}명 접속 중
    </p>
  )

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-3 border-b bg-background",
      className
    )}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-semibold text-lg">{title}</h1>
          {showUserListPopover ? (
            <Popover
              open={userListOpen}
              onOpenChange={setUserListOpen}
              trigger={userCountElement}
              align="start"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-sm mb-3">접속자 목록</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                      <Avatar fallback={user.name[0]} className="h-8 w-8" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </Popover>
          ) : (
            userCountElement
          )}
        </div>
      </div>

      <div className={cn("flex items-center gap-1.5", status.color)}>
        <StatusIcon className="h-4 w-4" />
        <span className="text-xs font-medium">{status.text}</span>
      </div>
    </div>
  )
}
