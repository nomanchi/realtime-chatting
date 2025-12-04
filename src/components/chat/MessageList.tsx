'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chat-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export function MessageList() {
  const { messages, currentUser } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
    <>
      <ScrollArea ref={scrollRef} className="h-full px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser?.id
            const hasImage = !!message.imageData

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
                      "rounded-lg overflow-hidden",
                      !hasImage && "px-4 py-2",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {hasImage ? (
                      <div className="space-y-2">
                        <img
                          src={message.imageData}
                          alt="첨부 이미지"
                          className="max-w-xs max-h-64 rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(message.imageData!)}
                        />
                        {message.content && message.content !== '이미지' && (
                          <p className="text-sm px-4 py-2">{message.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Fullscreen Image Viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        {selectedImage && (
          <img
            src={selectedImage}
            alt="전체화면 이미지"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </Dialog>
    </>
  )
}
