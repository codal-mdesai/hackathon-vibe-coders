'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Share2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { PinCard } from './PinCard'
import { getPins } from '@/sanity/queries/pins'
import {
  createPin,
  updatePinPosition,
  softDeletePin,
  restorePin,
  fetchPageTitle,
} from '@/actions/pinboard'
import { useSpace } from '@/providers/SpaceProvider'
import type { PinDoc } from '@/types/sanity'

const GRID = 24

const COLOR_OPTIONS = [
  { name: 'zinc', hex: '#71717a' },
  { name: 'violet', hex: '#7c3aed' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'red', hex: '#ef4444' },
]

type UndoItem = {
  pin: PinDoc
  timeoutId: ReturnType<typeof setTimeout>
}

function getNewPinPosition(
  existingPins: PinDoc[],
  cardW: number,
  cardH: number,
  boardEl: HTMLDivElement | null,
): { gridX: number; gridY: number } {
  const boardW = boardEl?.offsetWidth ?? 800
  const stepX = Math.ceil(cardW / GRID) + 1
  const stepY = Math.ceil(cardH / GRID) + 2
  const maxCols = Math.max(1, Math.floor(boardW / (stepX * GRID)))
  const occupied = new Set(existingPins.map((p) => `${p.gridX ?? 0},${p.gridY ?? 0}`))

  let col = 0
  let row = 0
  while (col < 100) {
    const gx = col * stepX + 1
    const gy = row * stepY + 3
    if (!occupied.has(`${gx},${gy}`)) return { gridX: gx, gridY: gy }
    col++
    if (col >= maxCols) { col = 0; row++ }
  }
  return { gridX: 1, gridY: 3 }
}

type Props = {
  spaceSlug: string
  isHero?: boolean
}

export function PinBoard({ spaceSlug, isHero = false }: Props) {
  const { displayName } = useSpace()
  const qc = useQueryClient()
  const boardRef = useRef<HTMLDivElement>(null)

  const cardW = isHero ? 200 : 220
  const cardH = isHero ? 160 : 180

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['pins', spaceSlug],
    queryFn: () => getPins(spaceSlug),
    refetchOnWindowFocus: true,
  })

  // Optimistically track deleted pins locally
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [undoStack, setUndoStack] = useState<UndoItem[]>([])
  const [wobblingIds, setWobblingIds] = useState<Set<string>>(new Set())

  const visiblePins = useMemo(
    () => pins.filter((p) => !deletedIds.has(p._id)),
    [pins, deletedIds],
  )

  // Assign stable fallback positions for pins without gridX/gridY
  const positionedPins = useMemo(() => {
    const stepX = Math.ceil(cardW / GRID) + 1
    const stepY = Math.ceil(cardH / GRID) + 2
    const boardW = boardRef.current?.offsetWidth ?? 800
    const maxCols = Math.max(1, Math.floor(boardW / (stepX * GRID)))
    return visiblePins.map((pin, i) => {
      if (pin.gridX !== undefined && pin.gridY !== undefined) return pin
      const col = i % maxCols
      const row = Math.floor(i / maxCols)
      return { ...pin, gridX: col * stepX + 1, gridY: row * stepY + 3 }
    })
  }, [visiblePins, cardW, cardH])

  const handleSoftDelete = useCallback((pinId: string) => {
    const pin = pins.find((p) => p._id === pinId)
    if (!pin) return

    setDeletedIds((prev) => new Set([...prev, pinId]))
    void softDeletePin(pinId)

    const timeoutId = setTimeout(() => {
      setUndoStack((prev) => prev.filter((u) => u.pin._id !== pinId))
      void qc.invalidateQueries({ queryKey: ['pins', spaceSlug] })
    }, 4000)

    setUndoStack((prev) => [...prev, { pin, timeoutId }])
  }, [pins, qc, spaceSlug])

  const handleUndo = useCallback((pinId: string) => {
    const item = undoStack.find((u) => u.pin._id === pinId)
    if (!item) return
    clearTimeout(item.timeoutId)
    setDeletedIds((prev) => { const next = new Set(prev); next.delete(pinId); return next })
    setUndoStack((prev) => prev.filter((u) => u.pin._id !== pinId))
    void restorePin(pinId)
  }, [undoStack])

  const handlePinDragEnd = useCallback((movedId: string, newGX: number, newGY: number) => {
    void updatePinPosition(movedId, newGX, newGY)
    const nearby = positionedPins
      .filter((p) => p._id !== movedId)
      .filter((p) => Math.abs((p.gridX ?? 0) - newGX) <= 2 && Math.abs((p.gridY ?? 0) - newGY) <= 2)
      .map((p) => p._id)
    if (nearby.length > 0) {
      setWobblingIds(new Set(nearby))
      setTimeout(() => setWobblingIds(new Set()), 600)
    }
  }, [positionedPins])

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['pins', spaceSlug] })
  }, [qc, spaceSlug])

  // Add pin popover state
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [color, setColor] = useState('zinc')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleUrlBlur = useCallback(async () => {
    if (!url.trim() || title.trim()) return
    setFetchingTitle(true)
    try {
      const fetched = await fetchPageTitle(url.trim())
      if (fetched) setTitle(fetched)
    } catch { /* ignore */ } finally {
      setFetchingTitle(false)
    }
  }, [url, title])

  const handleSavePin = async () => {
    if (!url.trim() || !title.trim()) return
    setSaving(true)
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const { gridX, gridY } = getNewPinPosition(visiblePins, cardW, cardH, boardRef.current)

      // Optimistic update — pin appears on board instantly
      const tempPin: PinDoc = {
        _id: `opt-${Date.now()}`,
        _type: 'pin',
        spaceSlug,
        url: url.trim(),
        title: title.trim(),
        tags: tagList,
        color,
        addedBy: displayName,
        gridX,
        gridY,
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<PinDoc[]>(['pins', spaceSlug], (old = []) => [...old, tempPin])

      // Close popover immediately
      setPopoverOpen(false)
      setUrl(''); setTitle(''); setTags(''); setColor('zinc')
      setSaving(false)

      // Persist and sync real data in background
      await createPin(spaceSlug, url.trim(), title.trim(), tagList, color, displayName, gridX, gridY)
      refresh()
    } catch (err) {
      console.error('Failed to create pin:', err)
      setSaving(false)
      void qc.invalidateQueries({ queryKey: ['pins', spaceSlug] })
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0f0f0f',
        backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
        backgroundSize: `${GRID}px ${GRID}px`,
      }}
    >
      {/* Board ref container — pins positioned inside this */}
      <div
        ref={boardRef}
        style={{ position: 'absolute', inset: 0 }}
      >
        <AnimatePresence>
          {positionedPins.map((pin) => (
            <PinCard
              key={pin._id}
              pin={pin}
              cardW={cardW}
              cardH={cardH}
              boardRef={boardRef}
              wobbling={wobblingIds.has(pin._id)}
              onSoftDelete={handleSoftDelete}
              onDragEnd={handlePinDragEnd}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating board header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(9,9,11,0.7)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(39,39,42,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pinboard
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-900 border-0 text-zinc-600">
            {visiblePins.length}
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Add Pin popover */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 gap-1 text-xs"
              >
                <Plus size={12} />
                Add pin
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="bg-[#18181b] border-zinc-800 text-zinc-100 w-80"
              side="bottom"
              align="end"
            >
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-100">Pin a link</p>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="https://…"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">
                    Title
                    {fetchingTitle && <Loader2 size={10} className="inline ml-1 animate-spin" />}
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Page title…"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Tags (comma separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, tools, docs"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Color</Label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setColor(c.name)}
                        className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                        style={{
                          backgroundColor: c.hex,
                          boxShadow: color === c.name ? `0 0 0 2px #18181b, 0 0 0 3px ${c.hex}` : 'none',
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" onClick={() => setPopoverOpen(false)} className="text-zinc-400 h-7 text-xs">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePin}
                    disabled={saving || !url.trim() || !title.trim()}
                    className="h-7 text-xs bg-[--accent] hover:opacity-90 text-white border-0"
                  >
                    {saving ? 'Saving…' : 'Pin it'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}>
          <Loader2 size={20} className="text-zinc-600 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && visiblePins.length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          zIndex: 5,
        }}>
          <p style={{ fontSize: 13, color: '#52525b' }}>No pins yet</p>
          <p style={{ fontSize: 11, color: '#3f3f46' }}>Click "Add pin" to pin your first link</p>
        </div>
      )}

      {/* Undo toasts */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {undoStack.map(({ pin }) => (
            <motion.div
              key={pin._id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              style={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 12,
                color: '#a1a1aa',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
              }}
            >
              <span>Pin removed</span>
              <button
                onClick={() => handleUndo(pin._id)}
                style={{
                  color: 'var(--accent, #6366f1)',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: 0,
                }}
              >
                Undo
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
