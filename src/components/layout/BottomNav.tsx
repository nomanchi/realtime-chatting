'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageCircle, Settings } from 'lucide-react'
import { useThemeStore } from '@/store/theme-store'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { themeColor } = useThemeStore()

  const navItems = [
    {
      name: '친구',
      icon: Users,
      path: '/friends'
    },
    {
      name: '채팅',
      icon: MessageCircle,
      path: '/chatrooms'
    },
    {
      name: '설정',
      icon: Settings,
      path: '/settings'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-200/30',
    purple: 'bg-purple-200/30',
    green: 'bg-green-200/30',
    orange: 'bg-orange-200/30',
    pink: 'bg-pink-200/30'
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${colorClasses[themeColor]} backdrop-blur-sm z-50`}>
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || pathname?.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-6 w-6" />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
