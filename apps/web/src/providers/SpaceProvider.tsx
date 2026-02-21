'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { updateSpaceAccent, updateSpaceName } from '@/actions/space'

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
  setCounts: (counts: SpaceCounts) => void
}

const SpaceContext = createContext<SpaceContextValue | null>(null)

export const ACCENT_SWATCHES = [
  '#6366f1', // indigo
  '#7c3aed', // violet
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#71717a', // zinc
]

const EMPTY_COUNTS: SpaceCounts = {
  apiKeys: 0,
  envVars: 0,
  graphql: 0,
  pins: 0,
  deployNotes: 0,
  webhooks: 0,
  payloads: 0,
}

export function SpaceProvider({
  children,
  slug,
  initialDisplayName,
  initialAccentColor,
  initialCounts,
}: {
  children: React.ReactNode
  slug: string
  initialDisplayName?: string
  initialAccentColor?: string
  initialCounts?: SpaceCounts
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? 'My Space')
  const [accentColor, setAccentColor] = useState(
    initialAccentColor ?? ACCENT_SWATCHES[0] ?? '#6366f1',
  )
  const [counts, setCounts] = useState<SpaceCounts>(initialCounts ?? EMPTY_COUNTS)

  // Apply accent CSS variable whenever it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    // Persist per-space in localStorage
    localStorage.setItem(`devpanel_accent_${slug}`, accentColor)
  }, [accentColor, slug])

  // Restore accent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`devpanel_accent_${slug}`)
    if (stored) {
      setAccentColor(stored)
    }
  }, [slug])

  const updateAccent = useCallback(
    async (color: string) => {
      setAccentColor(color)
      await updateSpaceAccent(slug, color)
    },
    [slug],
  )

  const updateName = useCallback(
    async (name: string) => {
      setDisplayName(name)
      await updateSpaceName(slug, name)
    },
    [slug],
  )

  const refreshCounts = useCallback(async () => {
    // Counts are refreshed via S5 dashboard query; no-op here as a stub
  }, [])

  const value: SpaceContextValue = {
    slug,
    displayName,
    accentColor,
    counts,
    updateAccent,
    updateName,
    refreshCounts,
    setCounts,
  }

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
}

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider')
  return ctx
}
