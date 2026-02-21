'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { ShareDialog } from '@/components/ShareDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Star, Copy, Check, MoreHorizontal, Trash2, Edit, Share2 } from 'lucide-react'
import { isSensitiveKey, maskValue } from '@/lib/mask'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { getWebhooks } from '@/sanity/queries/webhooks'
import {
  createWebhook, updateWebhook, deleteWebhook,
  toggleWebhookFavorite, updateWebhookLastUsed,
} from '@/actions/webhooks'
import type { WebhookDoc } from '@/types/sanity'

type Props = { spaceSlug: string }
type KVRow = { key: string; value: string }

function KVRows({ rows, onChange, valuePlaceholder }: { rows: KVRow[]; onChange: (r: KVRow[]) => void; valuePlaceholder?: string }) {
  const addRow = () => onChange([...rows, { key: '', value: '' }])
  const update = (i: number, field: 'key' | 'value', v: string) => {
    const next = [...rows]
    next[i] = { ...next[i]!, [field]: v }
    onChange(next)
  }
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input value={row.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder="Key" className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs flex-1 font-mono" />
          <Input value={row.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder={valuePlaceholder ?? 'Value'} className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs flex-1" />
          <Button size="sm" variant="ghost" className="h-9 w-7 p-0 text-zinc-600 hover:text-red-400" onClick={() => remove(i)}>×</Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="h-7 gap-1 text-zinc-500 hover:text-zinc-300" onClick={addRow}>
        <Plus size={12} /> Add row
      </Button>
    </div>
  )
}

function WebhookCard({ w, spaceSlug, onMutate }: { w: WebhookDoc; spaceSlug: string; onMutate: () => void }) {
  const { copied, copy } = useCopyToClipboard()
  const [editOpen, setEditOpen] = useState(false)

  const handleCopyPayload = useCallback(async () => {
    if (!w.payload) return
    await copy(w.payload)
    await updateWebhookLastUsed(w._id)
    onMutate()
  }, [w._id, w.payload, copy, onMutate])

  const handleToggleFav = useCallback(async () => {
    await toggleWebhookFavorite(w._id, !w.isFavorite)
    onMutate()
  }, [w._id, w.isFavorite, onMutate])

  const handleDelete = useCallback(async () => {
    await deleteWebhook(w._id)
    onMutate()
  }, [w._id, onMutate])

  const commentsMap = Object.fromEntries((w.comments ?? []).map((c) => [c.field, c.comment]))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="p-4 bg-[#18181b] border border-zinc-800/60 rounded-lg hover:border-zinc-700/60 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500">{w.projectName}</span>
            <span className="text-sm font-medium text-zinc-200">{w.name}</span>
          </div>
          <p className="font-mono text-xs text-zinc-400 mb-2 truncate">{w.url}</p>

          {w.headers && w.headers.length > 0 && (
            <div className="space-y-1 mb-2">
              {w.headers.map((h) => (
                <div key={h._key} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-zinc-500">{h.key}:</span>
                  <span className="font-mono text-zinc-400">
                    {isSensitiveKey(h.key) ? maskValue(h.value) : h.value}
                  </span>
                  {commentsMap[h.key] && (
                    <span className="text-zinc-600 italic">// {commentsMap[h.key]}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {w.payload && (
            <pre className="font-mono text-xs text-zinc-600 overflow-hidden line-clamp-3 bg-zinc-900/40 p-2 rounded">
              {w.payload.slice(0, 200)}
            </pre>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {w.payload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200" onClick={handleCopyPayload}>
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy payload</TooltipContent>
            </Tooltip>
          )}

          <ShareDialog
            spaceSlug={spaceSlug}
            resourceType="webhook"
            resourceId={w._id}
            trigger={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200">
                    <Share2 size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share (expiring link)</TooltipContent>
              </Tooltip>
            }
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost"
                className={`h-7 w-7 p-0 ${w.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                onClick={handleToggleFav}
              >
                <Star size={13} fill={w.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{w.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"><MoreHorizontal size={13} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#18181b] border-zinc-700 text-zinc-200 w-36">
              <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer hover:bg-zinc-800"><Edit size={13} className="mr-2" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-400 hover:bg-zinc-800 focus:text-red-400"><Trash2 size={13} className="mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EditWebhookDialog open={editOpen} onOpenChange={setEditOpen} w={w} onMutate={onMutate} />
    </motion.div>
  )
}

type WebhookFormData = {
  project: string
  name: string
  url: string
  headers: KVRow[]
  payload: string
  comments: KVRow[]
}

function WebhookFormFields({ data, onChange }: { data: WebhookFormData; onChange: (d: WebhookFormData) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Project</Label>
          <Input value={data.project} onChange={(e) => onChange({ ...data, project: e.target.value })} placeholder="my-app" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Name</Label>
          <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="Deploy Hook" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">URL</Label>
        <Input value={data.url} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://…" className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Headers</Label>
        <KVRows rows={data.headers} onChange={(r) => onChange({ ...data, headers: r })} valuePlaceholder="Value" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Payload (JSON)</Label>
        <Textarea value={data.payload} onChange={(e) => onChange({ ...data, payload: e.target.value })} placeholder='{"event": "deploy"}' className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[80px]" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Field Comments</Label>
        <KVRows rows={data.comments} onChange={(r) => onChange({ ...data, comments: r })} valuePlaceholder="Comment about this field" />
      </div>
    </div>
  )
}

function AddWebhookDialog({ spaceSlug, onCreated }: { spaceSlug: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<WebhookFormData>({ project: '', name: '', url: '', headers: [], payload: '', comments: [] })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!data.project.trim() || !data.name.trim() || !data.url.trim()) return
    setSaving(true)
    try {
      await createWebhook(spaceSlug, data.project, data.name, data.url, data.headers.filter((h) => h.key), data.payload, data.comments.filter((c) => c.key).map((c) => ({ field: c.key, comment: c.value })))
      onCreated()
      setOpen(false)
      setData({ project: '', name: '', url: '', headers: [], payload: '', comments: [] })
    } catch (err) {
      console.error('Failed to create webhook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0"><Plus size={14} /> Add Webhook</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-zinc-100">Add Webhook</DialogTitle></DialogHeader>
        <div className="pt-2 space-y-4">
          <WebhookFormFields data={data} onChange={setData} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !data.project.trim() || !data.name.trim() || !data.url.trim()} className="bg-[--accent] hover:opacity-90 text-white border-0">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditWebhookDialog({ open, onOpenChange, w, onMutate }: { open: boolean; onOpenChange: (v: boolean) => void; w: WebhookDoc; onMutate: () => void }) {
  const [data, setData] = useState<WebhookFormData>({
    project: w.projectName, name: w.name, url: w.url,
    headers: w.headers.map((h) => ({ key: h.key, value: h.value })),
    payload: w.payload ?? '',
    comments: w.comments.map((c) => ({ key: c.field, value: c.comment })),
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateWebhook(w._id, data.project, data.name, data.url, data.headers.filter((h) => h.key), data.payload, data.comments.filter((c) => c.key).map((c) => ({ field: c.key, comment: c.value })))
      onMutate()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update webhook:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-zinc-100">Edit Webhook</DialogTitle></DialogHeader>
        <div className="pt-2 space-y-4">
          <WebhookFormFields data={data} onChange={setData} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[--accent] hover:opacity-90 text-white border-0">{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  )
}

export function WebhooksSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', spaceSlug],
    queryFn: () => getWebhooks(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['webhooks', spaceSlug] })
  }, [qc, spaceSlug])

  const favorites = webhooks.filter((w) => w.isFavorite)
  const recentlyUsed = webhooks.filter((w) => !w.isFavorite && w.lastUsed)
    .sort((a, b) => new Date(b.lastUsed ?? 0).getTime() - new Date(a.lastUsed ?? 0).getTime())
    .slice(0, 5)
  const byProject: Record<string, WebhookDoc[]> = {}
  for (const w of webhooks) {
    if (!byProject[w.projectName]) byProject[w.projectName] = []
    byProject[w.projectName]!.push(w)
  }

  return (
    <SectionPageShell
      title="Webhooks"
      description="Save webhook configs with headers, payloads, and shareable links."
      action={<AddWebhookDialog spaceSlug={spaceSlug} onCreated={refresh} />}
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No webhooks saved yet</p>
          <AddWebhookDialog spaceSlug={spaceSlug} onCreated={refresh} />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {favorites.length > 0 && (
            <div>
              <SectionHeader label="⭐ Favorites" />
              <div className="space-y-2">
                <AnimatePresence>
                  {favorites.map((w) => <WebhookCard key={w._id} w={w} spaceSlug={spaceSlug} onMutate={refresh} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {recentlyUsed.length > 0 && (
            <div>
              <SectionHeader label="🕐 Recently Used" />
              <div className="space-y-2">
                <AnimatePresence>
                  {recentlyUsed.map((w) => <WebhookCard key={w._id} w={w} spaceSlug={spaceSlug} onMutate={refresh} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          <div>
            <SectionHeader label="📁 All Webhooks" />
            <div className="space-y-4">
              {Object.entries(byProject).map(([project, ws]) => (
                <div key={project}>
                  <p className="text-xs text-zinc-500 mb-2">{project}</p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {ws.map((w) => <WebhookCard key={w._id} w={w} spaceSlug={spaceSlug} onMutate={refresh} />)}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SectionPageShell>
  )
}
