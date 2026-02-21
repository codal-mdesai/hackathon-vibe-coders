'use client'

import { useState, useEffect } from 'react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function LiveClock() {
  const [time, setTime] = useState<string>('')
  const [greeting, setGreeting] = useState<string>('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
      setGreeting(getGreeting())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-zinc-400 text-sm">{greeting}</span>
      <span className="text-zinc-600 font-mono text-xs">{time}</span>
    </div>
  )
}
