'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionPageShell } from '@/components/SectionPageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus, Star, Copy, Check, MoreHorizontal, Trash2, Edit, Eye, EyeOff,
} from 'lucide-react'
import { maskValue } from '@/lib/mask'
import { deriveKey, encrypt, decrypt } from '@/lib/crypto'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { getApiKeyGroups } from '@/sanity/queries/api-keys'
import {
  createApiKey,
  deleteApiKey,
  toggleApiKeyFavorite,
  incrementApiKeyUsage,
  updateApiKey,
} from '@/actions/api-keys'
import type { ApiKeyGroup, ApiKeyEntry } from '@/types/sanity'

type Props = { spaceSlug: string }

function StoreCombobox({
  value,
  onChange,
  stores,
}: {
  value: string
  onChange: (v: string) => void
  stores: string[]
}) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. OpenAI, Stripe, GitHub"
        list="store-list"
        className="bg-zinc-900 border-zinc-700 text-zinc-100"
      />
      <datalist id="store-list">
        {stores.map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  )
}

function AddKeyDialog({
  spaceSlug,
  stores,
  onCreated,
}: {
  spaceSlug: string
  stores: string[]
  onCreated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!storeName.trim() || !label.trim() || !value.trim()) return
    setSaving(true)
    try {
      const key = await deriveKey(spaceSlug)
      const encryptedValue = await encrypt(value, key)
      await createApiKey(spaceSlug, storeName.trim(), label.trim(), encryptedValue)
      onCreated()
      setOpen(false)
      setStoreName(''); setLabel(''); setValue('')
    } catch (err) {
      console.error('Failed to create API key:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0">
          <Plus size={14} /> Add Key
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Add API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Store / Service</Label>
            <StoreCombobox value={storeName} onChange={setStoreName} stores={stores} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production key"
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Value</Label>
            <div className="relative">
              <Input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk-..."
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
              disabled={saving || !storeName.trim() || !label.trim() || !value.trim()}
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

function KeyCard({
  group,
  entry,
  spaceSlug,
  onMutate,
}: {
  group: ApiKeyGroup
  entry: ApiKeyEntry
  spaceSlug: string
  onMutate: () => void
}) {
  const { copied, copy } = useCopyToClipboard()
  const [editOpen, setEditOpen] = useState(false)
  const [editLabel, setEditLabel] = useState(entry.label)
  const [editValue, setEditValue] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      const key = await deriveKey(spaceSlug)
      const plain = await decrypt(entry.encryptedValue, key)
      await copy(plain)
      await incrementApiKeyUsage(group._id, entry._key)
      onMutate()
    } catch (err) {
      console.error('Failed to decrypt/copy:', err)
    }
  }, [entry, group._id, spaceSlug, copy, onMutate])

  const handleToggleFav = useCallback(async () => {
    await toggleApiKeyFavorite(group._id, entry._key, !entry.isFavorite)
    onMutate()
  }, [entry, group._id, onMutate])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteApiKey(group._id, entry._key)
      onMutate()
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(false)
    }
  }, [entry._key, group._id, onMutate])

  const handleEditSave = useCallback(async () => {
    try {
      const cryptoKey = await deriveKey(spaceSlug)
      const encryptedValue = editValue
        ? await encrypt(editValue, cryptoKey)
        : entry.encryptedValue
      await updateApiKey(group._id, entry._key, editLabel, encryptedValue)
      onMutate()
      setEditOpen(false)
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }, [editLabel, editValue, entry, group._id, spaceSlug, onMutate])

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
          <span className="text-xs text-zinc-500">{group.storeName}</span>
          <span className="text-sm text-zinc-200 truncate">{entry.label}</span>
        </div>
        <span className="font-mono text-xs text-zinc-600 tracking-wider">
          {maskValue(entry.encryptedValue.slice(-8))}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
              onClick={handleCopy}
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy value</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
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
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer text-red-400 hover:bg-zinc-800 focus:text-red-400"
            >
              <Trash2 size={13} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Label</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">New Value (leave blank to keep current)</Label>
              <div className="relative">
                <Input
                  type={showEdit ? 'text' : 'password'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="New value…"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEdit(!showEdit)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
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

export function ApiKeysSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['api-keys', spaceSlug],
    queryFn: () => getApiKeyGroups(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['api-keys', spaceSlug] })
  }, [qc, spaceSlug])

  // Flatten all keys with group info
  const allKeys = groups.flatMap((g) =>
    (g.keys ?? []).map((k) => ({ group: g, entry: k })),
  )

  const favorites = allKeys.filter(({ entry }) => entry.isFavorite)
  const topUsed = [...allKeys]
    .filter(({ entry }) => !entry.isFavorite)
    .sort((a, b) => (b.entry.usageCount ?? 0) - (a.entry.usageCount ?? 0))
    .slice(0, 5)
  const stores = [...new Set(groups.map((g) => g.storeName))]

  // Group remaining by store
  const byStore: Record<string, { group: ApiKeyGroup; entry: ApiKeyEntry }[]> = {}
  for (const item of allKeys) {
    const sn = item.group.storeName
    if (!byStore[sn]) byStore[sn] = []
    byStore[sn].push(item)
  }

  return (
    <SectionPageShell
      title="API Keys"
      description="Encrypted at rest. Decrypted only at copy time."
      action={
        <AddKeyDialog spaceSlug={spaceSlug} stores={stores} onCreated={refresh} />
      }
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : allKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No API keys yet</p>
          <AddKeyDialog spaceSlug={spaceSlug} stores={[]} onCreated={refresh} />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {favorites.length > 0 && (
            <div>
              <SectionHeader label="⭐ Favorites" />
              <div className="flex gap-3 overflow-x-auto pb-2">
                {favorites.map(({ group, entry }) => (
                  <div key={entry._key} className="min-w-[260px]">
                    <KeyCard group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {topUsed.length > 0 && (
            <div>
              <SectionHeader label="🔥 Top Used" />
              <div className="space-y-2">
                <AnimatePresence>
                  {topUsed.map(({ group, entry }) => (
                    <KeyCard key={entry._key} group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div>
            <SectionHeader label="📁 All Keys" />
            <div className="space-y-4">
              {Object.entries(byStore).map(([storeName, items]) => (
                <div key={storeName}>
                  <p className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
                    {storeName}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-zinc-800 border-0 font-mono text-zinc-500">
                      {items.length}
                    </Badge>
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map(({ group, entry }) => (
                        <KeyCard key={entry._key} group={group} entry={entry} spaceSlug={spaceSlug} onMutate={refresh} />
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
