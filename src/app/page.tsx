'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPlatform } from '@/lib/platform'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const platform = getPlatform()
    router.push(`/${platform}`)
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">플랫폼 감지 중...</p>
      </div>
    </div>
  )
}
