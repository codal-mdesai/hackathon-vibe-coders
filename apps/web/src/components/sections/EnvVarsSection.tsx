'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Star, Copy, Check, MoreHorizontal, Trash2, Edit, Eye, EyeOff } from 'lucide-react'
import { maskValue } from '@/lib/mask'
import { deriveKey, encrypt, decrypt } from '@/lib/crypto'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { getEnvGroups } from '@/sanity/queries/env-vars'
import {
  createEnvVar, updateEnvVar, deleteEnvVar,
  toggleEnvVarFavorite, updateEnvVarLastUsed,
} from '@/actions/env-vars'
import type { EnvGroupDoc, EnvVarEntry } from '@/types/sanity'

type Props = { spaceSlug: string }

function AddVarDialog({ spaceSlug, projects, onCreated }: { spaceSlug: string; projects: string[]; onCreated: () => void }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState('')
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!project.trim() || !key.trim() || !value.trim()) return
    setSaving(true)
    try {
      const cryptoKey = await deriveKey(spaceSlug)
      const encryptedValue = await encrypt(value, cryptoKey)
      const upperKey = key.trim().toUpperCase()

      // Optimistic update — show item instantly
      const tempEntry: EnvVarEntry = {
        _key: `opt-${Date.now()}`,
        id: `opt-${Date.now()}`,
        key: upperKey,
        encryptedValue,
        isFavorite: false,
        usageCount: 0,
      }
      qc.setQueryData<EnvGroupDoc[]>(['env-vars', spaceSlug], (old = []) => {
        const idx = old.findIndex((g) => g.projectName === project.trim())
        if (idx >= 0) {
          return old.map((g, i) =>
            i === idx ? { ...g, vars: [...(g.vars ?? []), tempEntry] } : g,
          )
        }
        return [
          ...old,
          {
            _id: `opt-g-${Date.now()}`,
            _type: 'envGroup' as const,
            spaceSlug,
            projectName: project.trim(),
            vars: [tempEntry],
          },
        ]
      })

      // Close immediately — item already visible
      setOpen(false)
      setProject(''); setKey(''); setValue('')
      setSaving(false)

      // Persist and sync
      await createEnvVar(spaceSlug, project.trim(), upperKey, encryptedValue)
      onCreated()
    } catch (err) {
      console.error('Failed to create env var:', err)
      setSaving(false)
      void qc.invalidateQueries({ queryKey: ['env-vars', spaceSlug] })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0">
          <Plus size={14} /> Add Var
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Add Env Variable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Project</Label>
            <Input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. my-app"
              list="project-list-env"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
            <datalist id="project-list-env">
              {projects.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">KEY</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="DATABASE_URL"
              className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">VALUE</Label>
            <div className="relative">
              <Input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="postgres://…"
                className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !project.trim() || !key.trim() || !value.trim()}
              className="bg-[--accent] hover:opacity-90 text-white border-0"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VarCard({ group, entry, spaceSlug, onMutate }: { group: EnvGroupDoc; entry: EnvVarEntry; spaceSlug: string; onMutate: () => void }) {
  const qc = useQueryClient()
  const { copied, copy } = useCopyToClipboard()
  const [editOpen, setEditOpen] = useState(false)
  const [editKey, setEditKey] = useState(entry.key)
  const [editValue, setEditValue] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      const cryptoKey = await deriveKey(spaceSlug)
      const plain = await decrypt(entry.encryptedValue, cryptoKey)
      await copy(`${entry.key}=${plain}`)
      void updateEnvVarLastUsed(group._id, entry._key)
    } catch (err) {
      console.error('Failed to copy env var:', err)
    }
  }, [entry, group._id, spaceSlug, copy])

  const handleToggleFav = useCallback(() => {
    const newFav = !entry.isFavorite
    qc.setQueryData<EnvGroupDoc[]>(['env-vars', spaceSlug], (old = []) =>
      old.map((g) =>
        g._id !== group._id ? g : {
          ...g,
          vars: (g.vars ?? []).map((v) =>
            v._key === entry._key ? { ...v, isFavorite: newFav } : v,
          ),
        },
      ),
    )
    void toggleEnvVarFavorite(group._id, entry._key, newFav).then(onMutate)
  }, [entry, group._id, onMutate, qc, spaceSlug])

  const handleDelete = useCallback(() => {
    qc.setQueryData<EnvGroupDoc[]>(['env-vars', spaceSlug], (old = []) =>
      old
        .map((g) => ({
          ...g,
          vars: (g.vars ?? []).filter((v) => v._key !== entry._key),
        }))
        .filter((g) => (g.vars ?? []).length > 0),
    )
    void deleteEnvVar(group._id, entry._key)
      .then(onMutate)
      .catch((err) => {
        console.error('Failed to delete:', err)
        void qc.invalidateQueries({ queryKey: ['env-vars', spaceSlug] })
      })
  }, [entry._key, group._id, onMutate, qc, spaceSlug])

  const handleEditSave = useCallback(async () => {
    try {
      const cryptoKey = await deriveKey(spaceSlug)
      const encryptedValue = editValue
        ? await encrypt(editValue, cryptoKey)
        : entry.encryptedValue
      await updateEnvVar(group._id, entry._key, editKey.toUpperCase(), encryptedValue)
      onMutate()
      setEditOpen(false)
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }, [editKey, editValue, entry, group._id, spaceSlug, onMutate])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 px-4 py-3 bg-[#18181b] border border-zinc-800/60 rounded-lg hover:border-zinc-700/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{group.projectName}</span>
          <span className="font-mono text-sm text-zinc-200 truncate">{entry.key}</span>
        </div>
        <span className="font-mono text-xs text-zinc-600 tracking-wider">
          {maskValue(entry.encryptedValue.slice(-8))}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200" onClick={handleCopy}>
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy KEY=VALUE</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm" variant="ghost"
              className={`h-7 w-7 p-0 ${entry.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
              onClick={handleToggleFav}
            >
              <Star size={13} fill={entry.isFavorite ? 'currentColor' : 'none'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{entry.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader><DialogTitle className="text-zinc-100">Edit Env Var</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">KEY</Label>
              <Input value={editKey} onChange={(e) => setEditKey(e.target.value.toUpperCase())} className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">New Value (leave blank to keep)</Label>
              <div className="relative">
                <Input
                  type={showEdit ? 'text' : 'password'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="New value…"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono pr-10"
                />
                <button type="button" onClick={() => setShowEdit(!showEdit)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showEdit ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleEditSave} className="bg-[--accent] hover:opacity-90 text-white border-0">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
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

export function EnvVarsSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['env-vars', spaceSlug],
    queryFn: () => getEnvGroups(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['env-vars', spaceSlug] })
  }, [qc, spaceSlug])

  const allVars = groups.flatMap((g) => (g.vars ?? []).map((v) => ({ group: g, entry: v })))
  const favorites = allVars.filter(({ entry }) => entry.isFavorite)
  const recentlyUsed = [...allVars]
    .filter(({ entry }) => !entry.isFavorite && entry.lastUsed)
    .sort((a, b) => new Date(b.entry.lastUsed ?? 0).getTime() - new Date(a.entry.lastUsed ?? 0).getTime())
    .slice(0, 5)
  const projects = [...new Set(groups.map((g) => g.projectName))]

  const byProject: Record<string, { group: EnvGroupDoc; entry: EnvVarEntry }[]> = {}
  for (const item of allVars) {
    const pn = item.group.projectName
    if (!byProject[pn]) byProject[pn] = []
    byProject[pn].push(item)
  }

  return (
    <SectionPageShell
      title="Env Variables"
      description="Encrypted at rest. Copies as KEY=VALUE."
      action={<AddVarDialog spaceSlug={spaceSlug} projects={projects} onCreated={refresh} />}
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : allVars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No env variables yet</p>
          <AddVarDialog spaceSlug={spaceSlug} projects={[]} onCreated={refresh} />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {favorites.length > 0 && (
            <div>
              <SectionHeader label="⭐ Favorites" />
              <div className="space-y-2">
                <AnimatePresence>
                  {favorites.map(({ group, entry }) => (
                    <VarCard key={entry._key} group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
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
                  {recentlyUsed.map(({ group, entry }) => (
                    <VarCard key={entry._key} group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div>
            <SectionHeader label="📁 All Variables" />
            <div className="space-y-4">
              {Object.entries(byProject).map(([projectName, items]) => (
                <div key={projectName}>
                  <p className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
                    {projectName}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800 border-0 font-mono text-zinc-500">
                      {items.length}
                    </Badge>
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map(({ group, entry }) => (
                        <VarCard key={entry._key} group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
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
