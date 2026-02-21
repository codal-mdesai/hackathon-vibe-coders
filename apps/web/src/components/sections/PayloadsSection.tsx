'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { ShareDialog } from '@/components/ShareDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { getJsonPayloads, getCurlCommands } from '@/sanity/queries/payloads'
import {
  createJsonPayload, updateJsonPayload, deleteJsonPayload, toggleJsonFavorite, updateJsonLastUsed,
  createCurlCommand, updateCurlCommand, deleteCurlCommand, toggleCurlFavorite, updateCurlLastUsed,
} from '@/actions/payloads'
import type { JsonPayloadDoc, CurlCommandDoc } from '@/types/sanity'

type Props = { spaceSlug: string }

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  )
}

// ─── JSON Payloads ───────────────────────────────────────────────────────────

function JsonCard({ j, spaceSlug, onMutate }: { j: JsonPayloadDoc; spaceSlug: string; onMutate: () => void }) {
  const { copied, copy } = useCopyToClipboard()
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState(j.projectName)
  const [editName, setEditName] = useState(j.name)
  const [editPayload, setEditPayload] = useState(j.payload)
  const [payloadError, setPayloadError] = useState('')

  const handleCopy = useCallback(async () => {
    await copy(j.payload)
    await updateJsonLastUsed(j._id)
    onMutate()
  }, [j._id, j.payload, copy, onMutate])

  const handleToggleFav = useCallback(async () => {
    await toggleJsonFavorite(j._id, !j.isFavorite)
    onMutate()
  }, [j._id, j.isFavorite, onMutate])

  const handleDelete = useCallback(async () => {
    await deleteJsonPayload(j._id)
    onMutate()
  }, [j._id, onMutate])

  const handleEditSave = useCallback(async () => {
    if (editPayload.trim()) {
      try { JSON.parse(editPayload) } catch { setPayloadError('Invalid JSON'); return }
    }
    setPayloadError('')
    await updateJsonPayload(j._id, editProject, editName, editPayload)
    onMutate()
    setEditOpen(false)
  }, [editProject, editName, editPayload, j._id, onMutate])

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
            <span className="text-xs text-zinc-500">{j.projectName}</span>
            <span className="text-sm font-medium text-zinc-200">{j.name}</span>
          </div>
          <pre className="font-mono text-xs text-zinc-600 overflow-hidden line-clamp-3">
            {j.payload.slice(0, 150)}
          </pre>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200" onClick={handleCopy}>
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy payload</TooltipContent>
          </Tooltip>
          <ShareDialog spaceSlug={spaceSlug} resourceType="jsonPayload" resourceId={j._id}
            trigger={<Tooltip><TooltipTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"><Share2 size={13} /></Button></TooltipTrigger><TooltipContent>Share</TooltipContent></Tooltip>}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost"
                className={`h-7 w-7 p-0 ${j.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                onClick={handleToggleFav}
              >
                <Star size={13} fill={j.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{j.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-zinc-100">Edit JSON Payload</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Project</Label>
                <Input value={editProject} onChange={(e) => setEditProject(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Payload (JSON)</Label>
              <Textarea value={editPayload} onChange={(e) => setEditPayload(e.target.value)} className={`bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[120px] ${payloadError ? 'border-red-500' : ''}`} />
              {payloadError && <p className="text-red-400 text-xs">{payloadError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleEditSave} className="bg-[--accent] hover:opacity-90 text-white border-0">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function AddJsonDialog({ spaceSlug, onCreated }: { spaceSlug: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState('')
  const [name, setName] = useState('')
  const [payload, setPayload] = useState('')
  const [payloadError, setPayloadError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (payload.trim()) {
      try { JSON.parse(payload) } catch { setPayloadError('Invalid JSON'); return }
    }
    setPayloadError('')
    setSaving(true)
    try {
      await createJsonPayload(spaceSlug, project, name, payload)
      onCreated()
      setOpen(false)
      setProject(''); setName(''); setPayload('')
    } catch (err) {
      console.error('Failed to create payload:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0"><Plus size={14} /> Add Payload</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-zinc-100">Add JSON Payload</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Project</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="my-app" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create User" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Payload (JSON)</Label>
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              onBlur={() => { if (payload.trim()) { try { JSON.parse(payload) } catch { setPayloadError('Invalid JSON') } } }}
              placeholder='{"name": "Alice"}'
              className={`bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[120px] ${payloadError ? 'border-red-500' : ''}`}
            />
            {payloadError && <p className="text-red-400 text-xs">{payloadError}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !project.trim() || !name.trim() || !payload.trim()} className="bg-[--accent] hover:opacity-90 text-white border-0">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── CURL Commands ────────────────────────────────────────────────────────────

function maskCurlCommand(command: string): string {
  // Mask inline header values that are sensitive (Authorization, x-api-key, etc.)
  return command.replace(/-H\s+['"]?([^'":\s]+):\s*([^'"]+)['"]?/g, (match, key: string, value: string) => {
    if (isSensitiveKey(key)) {
      return match.replace(value, maskValue(value))
    }
    return match
  })
}

function CurlCard({ c, spaceSlug, onMutate }: { c: CurlCommandDoc; spaceSlug: string; onMutate: () => void }) {
  const { copied, copy } = useCopyToClipboard()
  const [editOpen, setEditOpen] = useState(false)
  const [editLabel, setEditLabel] = useState(c.label)
  const [editCommand, setEditCommand] = useState(c.command)
  const [editCategory, setEditCategory] = useState(c.category)

  const handleCopy = useCallback(async () => {
    await copy(c.command)
    await updateCurlLastUsed(c._id)
    onMutate()
  }, [c._id, c.command, copy, onMutate])

  const handleToggleFav = useCallback(async () => {
    await toggleCurlFavorite(c._id, !c.isFavorite)
    onMutate()
  }, [c._id, c.isFavorite, onMutate])

  const handleDelete = useCallback(async () => {
    await deleteCurlCommand(c._id)
    onMutate()
  }, [c._id, onMutate])

  const handleEditSave = useCallback(async () => {
    await updateCurlCommand(c._id, editLabel, editCommand, editCategory)
    onMutate()
    setEditOpen(false)
  }, [c._id, editLabel, editCommand, editCategory, onMutate])

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
            <span className="text-sm font-medium text-zinc-200">{c.label}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800 border-0 text-zinc-500">{c.category}</Badge>
          </div>
          <pre className="font-mono text-xs text-zinc-500 overflow-hidden line-clamp-2">
            {maskCurlCommand(c.command)}
          </pre>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200" onClick={handleCopy}>
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy command</TooltipContent>
          </Tooltip>
          <ShareDialog spaceSlug={spaceSlug} resourceType="curlCommand" resourceId={c._id}
            trigger={<Tooltip><TooltipTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"><Share2 size={13} /></Button></TooltipTrigger><TooltipContent>Share</TooltipContent></Tooltip>}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost"
                className={`h-7 w-7 p-0 ${c.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                onClick={handleToggleFav}
              >
                <Star size={13} fill={c.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{c.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-zinc-100">Edit CURL Command</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Label</Label>
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Category</Label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Auth, Data, Deploy…" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Command</Label>
              <Textarea value={editCommand} onChange={(e) => setEditCommand(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[80px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleEditSave} className="bg-[--accent] hover:opacity-90 text-white border-0">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function AddCurlDialog({ spaceSlug, categories, onCreated }: { spaceSlug: string; categories: string[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [command, setCommand] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!label.trim() || !command.trim() || !category.trim()) return
    setSaving(true)
    try {
      await createCurlCommand(spaceSlug, label, command, category)
      onCreated()
      setOpen(false)
      setLabel(''); setCommand(''); setCategory('')
    } catch (err) {
      console.error('Failed to create CURL command:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0"><Plus size={14} /> Add Command</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-zinc-100">Add CURL Command</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Get Users" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Auth, Data, Deploy…"
                list="curl-categories"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
              <datalist id="curl-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Command (Geist Mono)</Label>
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="curl -X GET https://api.example.com/users -H 'Authorization: Bearer token'"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !label.trim() || !command.trim() || !category.trim()} className="bg-[--accent] hover:opacity-90 text-white border-0">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function PayloadsSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'json' | 'curl'>('json')

  const { data: jsonPayloads = [], isLoading: loadingJson } = useQuery({
    queryKey: ['json-payloads', spaceSlug],
    queryFn: () => getJsonPayloads(spaceSlug),
    refetchOnWindowFocus: true,
  })
  const { data: curlCommands = [], isLoading: loadingCurl } = useQuery({
    queryKey: ['curl-commands', spaceSlug],
    queryFn: () => getCurlCommands(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refreshJson = useCallback(() => void qc.invalidateQueries({ queryKey: ['json-payloads', spaceSlug] }), [qc, spaceSlug])
  const refreshCurl = useCallback(() => void qc.invalidateQueries({ queryKey: ['curl-commands', spaceSlug] }), [qc, spaceSlug])

  const jsonFavorites = jsonPayloads.filter((j) => j.isFavorite)
  const jsonRecent = jsonPayloads.filter((j) => !j.isFavorite && j.lastUsed).sort((a, b) => new Date(b.lastUsed ?? 0).getTime() - new Date(a.lastUsed ?? 0).getTime()).slice(0, 5)
  const jsonByProject: Record<string, JsonPayloadDoc[]> = {}
  for (const j of jsonPayloads) {
    if (!jsonByProject[j.projectName]) jsonByProject[j.projectName] = []
    jsonByProject[j.projectName]!.push(j)
  }

  const curlFavorites = curlCommands.filter((c) => c.isFavorite)
  const curlRecent = curlCommands.filter((c) => !c.isFavorite && c.lastUsed).sort((a, b) => new Date(b.lastUsed ?? 0).getTime() - new Date(a.lastUsed ?? 0).getTime()).slice(0, 5)
  const categories = [...new Set(curlCommands.map((c) => c.category))]
  const curlByCategory: Record<string, CurlCommandDoc[]> = {}
  for (const c of curlCommands) {
    if (!curlByCategory[c.category]) curlByCategory[c.category] = []
    curlByCategory[c.category]!.push(c)
  }

  const tabAction = activeTab === 'json'
    ? <AddJsonDialog spaceSlug={spaceSlug} onCreated={refreshJson} />
    : <AddCurlDialog spaceSlug={spaceSlug} categories={categories} onCreated={refreshCurl} />

  return (
    <SectionPageShell
      title="JSON + CURL"
      description="Save and share JSON payloads and CURL commands."
      action={tabAction}
    >
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 border-b border-zinc-800/60 pb-0">
        {(['json', 'curl'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-zinc-100 border-[--accent]'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent'
            }`}
          >
            {tab === 'json' ? 'JSON Payloads' : 'CURL Commands'}
          </button>
        ))}
      </div>

      {activeTab === 'json' && (
        loadingJson ? <div className="text-zinc-600 text-sm">Loading…</div> :
        jsonPayloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-500 text-sm">No JSON payloads yet</p>
            <AddJsonDialog spaceSlug={spaceSlug} onCreated={refreshJson} />
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {jsonFavorites.length > 0 && (
              <div>
                <SectionHeader label="⭐ Favorites" />
                <div className="space-y-2">
                  <AnimatePresence>
                    {jsonFavorites.map((j) => <JsonCard key={j._id} j={j} spaceSlug={spaceSlug} onMutate={refreshJson} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {jsonRecent.length > 0 && (
              <div>
                <SectionHeader label="🕐 Recently Used" />
                <div className="space-y-2">
                  <AnimatePresence>
                    {jsonRecent.map((j) => <JsonCard key={j._id} j={j} spaceSlug={spaceSlug} onMutate={refreshJson} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}
            <div>
              <SectionHeader label="📁 All Payloads" />
              <div className="space-y-4">
                {Object.entries(jsonByProject).map(([project, js]) => (
                  <div key={project}>
                    <p className="text-xs text-zinc-500 mb-2">{project}</p>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {js.map((j) => <JsonCard key={j._id} j={j} spaceSlug={spaceSlug} onMutate={refreshJson} />)}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'curl' && (
        loadingCurl ? <div className="text-zinc-600 text-sm">Loading…</div> :
        curlCommands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-500 text-sm">No CURL commands yet</p>
            <AddCurlDialog spaceSlug={spaceSlug} categories={[]} onCreated={refreshCurl} />
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {curlFavorites.length > 0 && (
              <div>
                <SectionHeader label="⭐ Favorites" />
                <div className="space-y-2">
                  <AnimatePresence>
                    {curlFavorites.map((c) => <CurlCard key={c._id} c={c} spaceSlug={spaceSlug} onMutate={refreshCurl} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {curlRecent.length > 0 && (
              <div>
                <SectionHeader label="🕐 Recently Used" />
                <div className="space-y-2">
                  <AnimatePresence>
                    {curlRecent.map((c) => <CurlCard key={c._id} c={c} spaceSlug={spaceSlug} onMutate={refreshCurl} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}
            <div>
              <SectionHeader label="📁 All Commands" />
              <div className="space-y-4">
                {Object.entries(curlByCategory).map(([cat, cs]) => (
                  <div key={cat}>
                    <p className="text-xs text-zinc-500 mb-2">{cat}</p>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {cs.map((c) => <CurlCard key={c._id} c={c} spaceSlug={spaceSlug} onMutate={refreshCurl} />)}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </SectionPageShell>
  )
}
