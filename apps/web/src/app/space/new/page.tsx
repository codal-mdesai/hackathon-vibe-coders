'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSpace } from '@/actions/space'

export default function NewSpacePage() {
  const router = useRouter()

  useEffect(() => {
    async function bootstrap() {
      // Generate a unique 10-char slug
      const slug = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      try {
        await createSpace(slug)
      } catch {
        // Space creation might fail if Sanity isn't configured yet — still proceed
      }
      localStorage.setItem('devpanel_space', slug)
      router.replace(`/space/${slug}`)
    }
    void bootstrap()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500 text-sm">
        <span className="animate-pulse">●</span>
        Creating your space…
      </div>
    </div>
  )
}
