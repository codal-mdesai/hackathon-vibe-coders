'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import { useSpace } from '@/providers/SpaceProvider'
import { getPins } from '@/sanity/queries/pins'
import { createPin, deletePin, fetchPageTitle } from '@/actions/pinboard'
import type { PinDoc } from '@/types/sanity'

type Props = { spaceSlug: string }

const COLOR_OPTIONS = [
  { name: 'zinc', hex: '#71717a' },
  { name: 'violet', hex: '#7c3aed' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'red', hex: '#ef4444' },
]

function getColorHex(colorName: string): string {
  return COLOR_OPTIONS.find((c) => c.name === colorName)?.hex ?? '#71717a'
}

function AddPinPopover({ spaceSlug, onCreated }: { spaceSlug: string; onCreated: () => void }) {
  const { displayName } = useSpace()
  const [open, setOpen] = useState(false)
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
    } catch {
      // Ignore
    } finally {
      setFetchingTitle(false)
    }
  }, [url, title])

  const handleSave = async () => {
    if (!url.trim() || !title.trim()) return
    setSaving(true)
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      await createPin(spaceSlug, url.trim(), title.trim(), tagList, color, displayName)
      onCreated()
      setOpen(false)
      setUrl(''); setTitle(''); setTags(''); setColor('zinc')
    } catch (err) {
      console.error('Failed to create pin:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[--accent] hover:opacity-90 text-white shadow-lg border-0 z-20"
        >
          <Plus size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-[#18181b] border-zinc-800 text-zinc-100 w-96 mr-6 mb-2"
        side="top"
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
              className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs"
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
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Tags (comma separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="react, typescript, tools"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-125"
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
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 h-8">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !url.trim() || !title.trim()}
              className="h-8 bg-[--accent] hover:opacity-90 text-white border-0"
            >
              {saving ? 'Saving…' : 'Pin it'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PinCard({ pin, onDelete }: { pin: PinDoc; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const colorHex = getColorHex(pin.color)

  let hostname = ''
  try { hostname = new URL(pin.url).hostname } catch { hostname = pin.url }

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deletePin(pin._id)
      onDelete()
    } catch (err) {
      console.error('Failed to delete pin:', err)
    } finally {
      setDeleting(false)
    }
  }, [pin._id, onDelete])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      whileHover={{ y: -2 }}
      className="bg-[#18181b] border border-zinc-800/60 rounded-lg overflow-hidden group break-inside-avoid mb-3"
      style={{ borderLeft: `3px solid ${colorHex}` }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <a
            href={pin.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-zinc-200 hover:text-white flex items-center gap-1.5 flex-1 min-w-0 group/link"
          >
            <span className="truncate">{pin.title}</span>
            <ExternalLink size={11} className="flex-shrink-0 text-zinc-600 group-hover/link:text-zinc-400" />
          </a>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove pin</TooltipContent>
          </Tooltip>
        </div>

        <p className="font-mono text-xs text-zinc-600 mt-1 truncate">{hostname}</p>

        {pin.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {pin.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800/80 border-0 text-zinc-500">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {pin.addedBy && (
          <p className="text-xs text-zinc-600 mt-2">Added by {pin.addedBy}</p>
        )}
      </div>
    </motion.div>
  )
}

export function PinboardSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['pins', spaceSlug],
    queryFn: () => getPins(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['pins', spaceSlug] })
  }, [qc, spaceSlug])

  return (
    <SectionPageShell
      title="Pinboard"
      description={`${pins.length} pins · newest first`}
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No pins yet</p>
          <p className="text-zinc-600 text-xs">Click the + button to pin your first link</p>
        </div>
      ) : (
        <div
          className="columns-1 md:columns-2 lg:columns-3 gap-3"
          style={{ columnGap: '12px' }}
        >
          {pins.map((pin, i) => (
            <motion.div
              key={pin._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
            >
              <PinCard pin={pin} onDelete={refresh} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating add button */}
      <AddPinPopover spaceSlug={spaceSlug} onCreated={refresh} />
    </SectionPageShell>
  )
}
