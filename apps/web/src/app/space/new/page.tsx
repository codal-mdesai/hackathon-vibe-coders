'use client'

// S3 implements full space creation. This is the entry point.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSpacePage() {
  const router = useRouter()

  useEffect(() => {
    // S3 wires this to actual Sanity space creation
    const slug = `space-${crypto.randomUUID().slice(0, 10)}`
    localStorage.setItem('devpanel_space', slug)
    router.replace(`/space/${slug}`)
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
