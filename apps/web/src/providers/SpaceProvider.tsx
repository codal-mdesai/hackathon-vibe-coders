'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type SpaceCounts = {
  apiKeys: number
  envVars: number
  graphql: number
  pins: number
  deployNotes: number
  webhooks: number
  payloads: number
}

export type SpaceContextValue = {
  slug: string
  displayName: string
  accentColor: string
  counts: SpaceCounts
  updateAccent: (color: string) => Promise<void>
  updateName: (name: string) => Promise<void>
  refreshCounts: () => Promise<void>
}

const SpaceContext = createContext<SpaceContextValue | null>(null)

const ACCENT_SWATCHES = [
  '#6366f1', // indigo
  '#7c3aed', // violet
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#71717a', // zinc
]

export { ACCENT_SWATCHES }

// Implemented fully in S3. This is the stub with correct interface.
export function SpaceProvider({
  children,
  slug,
  initialDisplayName,
  initialAccentColor,
}: {
  children: React.ReactNode
  slug: string
  initialDisplayName?: string
  initialAccentColor?: string
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? 'My Space')
  const [accentColor, setAccentColor] = useState(initialAccentColor ?? ACCENT_SWATCHES[0] ?? '#6366f1')
  const [counts, setCounts] = useState<SpaceCounts>({
    apiKeys: 0,
    envVars: 0,
    graphql: 0,
    pins: 0,
    deployNotes: 0,
    webhooks: 0,
    payloads: 0,
  })

  // Apply accent to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  const updateAccent = async (color: string) => {
    setAccentColor(color)
    // S3 wires this to a Server Action + Sanity write
  }

  const updateName = async (name: string) => {
    setDisplayName(name)
    // S3 wires this to a Server Action + Sanity write
  }

  const refreshCounts = async () => {
    // S3/S5 implement this via GROQ
  }

  const value: SpaceContextValue = {
    slug,
    displayName,
    accentColor,
    counts,
    updateAccent,
    updateName,
    refreshCounts,
  }

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
}

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider')
  return ctx
}
