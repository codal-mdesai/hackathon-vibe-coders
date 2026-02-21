'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Plus, Star, Copy, Check, MoreHorizontal, Trash2, Edit,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { getDeployNotes } from '@/sanity/queries/deploy'
import {
  createDeployNote, updateDeployNote, deleteDeployNote,
  toggleDeployFavorite, updateDeployLastUsed, generateReadme,
} from '@/actions/deploy-notes'
import type { DeployNoteDoc, TechArea } from '@/types/sanity'

type Props = { spaceSlug: string }

type CommandRow = { step: number; command: string; description: string }

function CommandsSheet({ area, noteProject, onClose }: { area: TechArea; noteProject: string; onClose: () => void }) {
  const { copied, copy } = useCopyToClipboard()
  const allCommands = area.commands.map((c) => c.command).join('\n')

  return (
    <SheetContent className="bg-[#18181b] border-zinc-800 text-zinc-100 w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-zinc-100">{noteProject} — {area.name}</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{area.commands.length} commands</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-zinc-400 hover:text-zinc-200" onClick={() => void copy(allCommands)}>
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            Copy all
          </Button>
        </div>
        <div className="space-y-2">
          {area.commands.map((cmd, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-zinc-900/60 rounded-lg">
              <span className="text-xs text-zinc-600 font-mono w-5 flex-shrink-0 pt-0.5">{cmd.step}</span>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-zinc-200 block">{cmd.command}</code>
                {cmd.description && <p className="text-xs text-zinc-500 mt-1">{cmd.description}</p>}
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-600 hover:text-zinc-300 flex-shrink-0" onClick={() => void copy(cmd.command)}>
                <Copy size={11} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </SheetContent>
  )
}

function TechAreaCard({
  note,
  area,
  spaceSlug,
  onMutate,
}: {
  note: DeployNoteDoc
  area: TechArea
  spaceSlug: string
  onMutate: () => void
}) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleToggleFav = useCallback(async () => {
    await toggleDeployFavorite(note._id, area._key, !area.isFavorite)
    onMutate()
  }, [note._id, area._key, area.isFavorite, onMutate])

  const handleDelete = useCallback(async () => {
    await deleteDeployNote(note._id, area._key)
    onMutate()
  }, [note._id, area._key, onMutate])

  const handleGetReadme = useCallback(async () => {
    const md = await generateReadme(note._id, area._key)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.projectName}-${area.name.replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
    await updateDeployLastUsed(note._id, area._key)
    onMutate()
  }, [note._id, note.projectName, area, onMutate])

  const handleSheetOpen = useCallback(async () => {
    setSheetOpen(true)
    await updateDeployLastUsed(note._id, area._key)
    onMutate()
  }, [note._id, area._key, onMutate])

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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-zinc-500">{note.projectName}</span>
            <span className="text-sm font-semibold text-zinc-200">{area.name}</span>
          </div>
          <div className="space-y-1">
            {area.commands.slice(0, 3).map((cmd, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-zinc-700 font-mono w-4">{cmd.step}.</span>
                <code className="text-xs font-mono text-zinc-400 truncate">{cmd.command}</code>
              </div>
            ))}
            {area.commands.length > 3 && (
              <p className="text-xs text-zinc-600">+{area.commands.length - 3} more</p>
            )}
          </div>
          {area.notes && (
            <div className="mt-2">
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400"
              >
                {notesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Notes
              </button>
              {notesOpen && (
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap">{area.notes}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-zinc-500 hover:text-zinc-200 text-xs gap-1" onClick={handleSheetOpen}>
                Commands
              </Button>
            </TooltipTrigger>
            <TooltipContent>View all commands</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200" onClick={handleGetReadme}>
                <Download size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Get README.md</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm" variant="ghost"
                className={`h-7 w-7 p-0 ${area.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                onClick={handleToggleFav}
              >
                <Star size={13} fill={area.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{area.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200">
                <MoreHorizontal size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#18181b] border-zinc-700 text-zinc-200 w-36">
              <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer hover:bg-zinc-800">
                <Edit size={13} className="mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-400 hover:bg-zinc-800 focus:text-red-400">
                <Trash2 size={13} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <CommandsSheet area={area} noteProject={note.projectName} onClose={() => setSheetOpen(false)} />
      </Sheet>

      <EditAreaDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        note={note}
        area={area}
        onMutate={onMutate}
      />
    </motion.div>
  )
}

function CommandRows({
  rows,
  onChange,
}: {
  rows: CommandRow[]
  onChange: (rows: CommandRow[]) => void
}) {
  const addRow = () => onChange([...rows, { step: rows.length + 1, command: '', description: '' }])
  const updateRow = (i: number, field: keyof CommandRow, value: string | number) => {
    const next = [...rows]
    next[i] = { ...next[i]!, [field]: value }
    onChange(next)
  }
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <Input
            type="number"
            value={row.step}
            onChange={(e) => updateRow(i, 'step', parseInt(e.target.value) || i + 1)}
            className="bg-zinc-900 border-zinc-700 text-zinc-100 w-16 flex-shrink-0 font-mono text-xs"
          />
          <Input
            value={row.command}
            onChange={(e) => updateRow(i, 'command', e.target.value)}
            placeholder="npm install"
            className="bg-zinc-900 border-zinc-700 text-zinc-100 flex-1 font-mono text-xs"
          />
          <Input
            value={row.description}
            onChange={(e) => updateRow(i, 'description', e.target.value)}
            placeholder="Description (optional)"
            className="bg-zinc-900 border-zinc-700 text-zinc-100 flex-1 text-xs"
          />
          <Button size="sm" variant="ghost" className="h-9 w-7 p-0 text-zinc-600 hover:text-red-400" onClick={() => removeRow(i)}>
            ×
          </Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="h-7 gap-1 text-zinc-500 hover:text-zinc-300" onClick={addRow}>
        <Plus size={12} /> Add command
      </Button>
    </div>
  )
}

function EditAreaDialog({
  open, onOpenChange, note, area, onMutate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  note: DeployNoteDoc
  area: TechArea
  onMutate: () => void
}) {
  const [name, setName] = useState(area.name)
  const [notes, setNotes] = useState(area.notes ?? '')
  const [commands, setCommands] = useState<CommandRow[]>(
    area.commands.map((c) => ({ step: c.step, command: c.command, description: c.description ?? '' })),
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDeployNote(note._id, area._key, name, commands, notes)
      onMutate()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update deploy note:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-zinc-100">Edit Tech Area</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Tech Area Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Commands</Label>
            <CommandRows rows={commands} onChange={setCommands} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[80px]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[--accent] hover:opacity-90 text-white border-0">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddNoteDialog({ spaceSlug, projects, onCreated }: { spaceSlug: string; projects: string[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState('')
  const [areaName, setAreaName] = useState('')
  const [commands, setCommands] = useState<CommandRow[]>([{ step: 1, command: '', description: '' }])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!project.trim() || !areaName.trim()) return
    setSaving(true)
    try {
      await createDeployNote(spaceSlug, project.trim(), areaName.trim(), commands.filter((c) => c.command.trim()), notes)
      onCreated()
      setOpen(false)
      setProject(''); setAreaName(''); setCommands([{ step: 1, command: '', description: '' }]); setNotes('')
    } catch (err) {
      console.error('Failed to create deploy note:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0">
          <Plus size={14} /> Add Tech Area
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-zinc-100">Add Tech Area</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Project</Label>
              <Input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="my-app"
                list="deploy-projects"
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
              <datalist id="deploy-projects">
                {projects.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Tech Area Name</Label>
              <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Frontend Deploy" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Commands</Label>
            <CommandRows rows={commands} onChange={setCommands} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to note about this deployment…" className="bg-zinc-900 border-zinc-700 text-zinc-100 min-h-[80px]" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !project.trim() || !areaName.trim()} className="bg-[--accent] hover:opacity-90 text-white border-0">
              {saving ? 'Saving…' : 'Save'}
            </Button>
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

export function DeployNotesSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['deploy-notes', spaceSlug],
    queryFn: () => getDeployNotes(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['deploy-notes', spaceSlug] })
  }, [qc, spaceSlug])

  const allAreas = notes.flatMap((n) =>
    (n.techAreas ?? []).map((a) => ({ note: n, area: a })),
  )
  const favorites = allAreas.filter(({ area }) => area.isFavorite)
  const recentlyUsed = [...allAreas]
    .filter(({ area }) => !area.isFavorite && area.lastUsed)
    .sort((a, b) => new Date(b.area.lastUsed ?? 0).getTime() - new Date(a.area.lastUsed ?? 0).getTime())
    .slice(0, 5)
  const projects = [...new Set(notes.map((n) => n.projectName))]
  const byProject: Record<string, { note: DeployNoteDoc; area: TechArea }[]> = {}
  for (const item of allAreas) {
    const pn = item.note.projectName
    if (!byProject[pn]) byProject[pn] = []
    byProject[pn]!.push(item)
  }

  return (
    <SectionPageShell
      title="Deploy Notes"
      description="Deployment commands, notes, and README generation."
      action={<AddNoteDialog spaceSlug={spaceSlug} projects={projects} onCreated={refresh} />}
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : allAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No deploy notes yet</p>
          <AddNoteDialog spaceSlug={spaceSlug} projects={[]} onCreated={refresh} />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {favorites.length > 0 && (
            <div>
              <SectionHeader label="⭐ Favorite Tech Areas" />
              <div className="space-y-2">
                <AnimatePresence>
                  {favorites.map(({ note, area }) => (
                    <TechAreaCard key={area._key} note={note} area={area} spaceSlug={spaceSlug} onMutate={refresh} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {recentlyUsed.length > 0 && (
            <div>
              <SectionHeader label="🕐 Recently Used" />
              <div className="space-y-2">
                <AnimatePresence>
                  {recentlyUsed.map(({ note, area }) => (
                    <TechAreaCard key={area._key} note={note} area={area} spaceSlug={spaceSlug} onMutate={refresh} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          <div>
            <SectionHeader label="📁 All Areas" />
            <div className="space-y-4">
              {Object.entries(byProject).map(([project, items]) => (
                <div key={project}>
                  <p className="text-xs text-zinc-500 mb-2">{project}</p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map(({ note, area }) => (
                        <TechAreaCard key={area._key} note={note} area={area} spaceSlug={spaceSlug} onMutate={refresh} />
                      ))}
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
