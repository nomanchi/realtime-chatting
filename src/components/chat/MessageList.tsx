'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chat-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function MessageList() {
  const { messages, currentUser } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>메시지가 없습니다. 첫 메시지를 보내보세요!</p>
      </div>
    )
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full px-4 py-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUser?.id

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                isCurrentUser && "flex-row-reverse"
              )}
            >
              <Avatar
                fallback={message.senderName[0]}
                className={cn(
                  "mt-1",
                  isCurrentUser && "bg-primary text-primary-foreground"
                )}
              />

              <div className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                isCurrentUser && "items-end"
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isCurrentUser ? '나' : message.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'HH:mm', { locale: ko })}
                  </span>
                </div>

                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
