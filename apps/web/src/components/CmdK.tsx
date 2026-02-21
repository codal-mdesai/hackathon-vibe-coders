'use client'

import { useEffect, useState, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { globalSearch, type SearchResult } from '@/sanity/queries/search'

type Props = { spaceSlug: string }

const SECTION_ICONS: Record<string, string> = {
  'API Keys': '🔑',
  'Env Vars': '🔒',
  GraphQL: '⬡',
  Pinboard: '📌',
  'Deploy Notes': '🚀',
  Webhooks: '🪝',
  'JSON & CURL': '{ }',
}

function groupBySection(results: SearchResult[]): Record<string, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!grouped[r.section]) grouped[r.section] = []
    grouped[r.section]!.push(r)
  }
  return grouped
}

export function CmdK({ spaceSlug }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track highlighted item _id for pulse animation after navigation
  const [pulsedId, setPulsedId] = useState<string | null>(null)

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounced GROQ search
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!value.trim()) {
        setResults([])
        return
      }
      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          try {
            const hits = await globalSearch(spaceSlug, value.trim())
            setResults(hits)
          } catch {
            setResults([])
          }
        })
      }, 300)
    },
    [spaceSlug],
  )

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      setQuery('')
      setResults([])
      // Navigate to section + briefly highlight matched item
      router.push(result.href)
      setPulsedId(result._id)
      setTimeout(() => setPulsedId(null), 2000)
    },
    [router],
  )

  // Clear state when dialog closes
  const handleOpenChange = useCallback((val: boolean) => {
    setOpen(val)
    if (!val) {
      setQuery('')
      setResults([])
    }
  }, [])

  const grouped = groupBySection(results)
  const sections = Object.keys(grouped)

  return (
    <>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center border-b border-zinc-800 px-3">
          <CommandInput
            placeholder="Search everything…"
            value={query}
            onValueChange={handleQueryChange}
            className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 py-3 text-sm outline-none border-0 focus:ring-0"
          />
          {isPending && <Loader2 size={14} className="text-zinc-500 animate-spin flex-shrink-0 mr-1" />}
        </div>
        <CommandList className="max-h-[400px] overflow-y-auto">
          {!query.trim() && (
            <div className="py-6 text-center text-xs text-zinc-600">
              Type to search across all sections
            </div>
          )}
          {query.trim() && !isPending && results.length === 0 && (
            <CommandEmpty className="py-6 text-center text-xs text-zinc-500">
              No results for &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}
          {sections.map((section) => (
            <CommandGroup
              key={section}
              heading={
                <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                  <span>{SECTION_ICONS[section] ?? '•'}</span>
                  {section}
                </span>
              }
            >
              {grouped[section]!.map((result) => (
                <CommandItem
                  key={result._id}
                  value={`${result._id}:${result.title}:${result.subtitle}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer rounded-md text-zinc-300 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-zinc-600 truncate">{result.subtitle}</span>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 bg-zinc-800 border-0 text-zinc-500 flex-shrink-0"
                  >
                    {section}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="border-t border-zinc-800 px-3 py-2 flex items-center gap-3 text-[10px] text-zinc-700">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> jump to section</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </CommandDialog>

      {/* Pulse animation style injected globally */}
      {pulsedId && (
        <style>{`
          [data-cmdk-pulse="${pulsedId}"] {
            animation: cmdk-pulse 2s ease-out;
          }
          @keyframes cmdk-pulse {
            0%   { box-shadow: 0 0 0 0 var(--accent); opacity: 1; }
            70%  { box-shadow: 0 0 0 8px transparent; opacity: 0.7; }
            100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
          }
        `}</style>
      )}
    </>
  )
}
