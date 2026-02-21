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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Star, Copy, Check, MoreHorizontal, Trash2, Edit, ChevronDown } from 'lucide-react'
import { isSensitiveKey, maskValue } from '@/lib/mask'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { getGqlQueries } from '@/sanity/queries/graphql'
import {
  createQuery, updateQuery, deleteQuery,
  toggleGqlFavorite, incrementGqlUsage,
} from '@/actions/graphql'
import type { GqlQueryDoc } from '@/types/sanity'

type Props = { spaceSlug: string }

type CopyFormat = 'query' | 'curl' | 'fetch' | 'axios' | 'node'

function buildCopyText(format: CopyFormat, q: GqlQueryDoc): string {
  const vars = q.variables && q.variables.trim() ? q.variables : '{}'
  switch (format) {
    case 'query':
      return q.query
    case 'curl':
      return `curl -X POST {endpoint} \\\n  -H 'Content-Type: application/json' \\\n  -d '{"query":${JSON.stringify(q.query)},"variables":${vars}}'`
    case 'fetch':
      return `fetch('{endpoint}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ query: \`${q.query}\`, variables: ${vars} }),\n})`
    case 'axios':
      return `axios.post('{endpoint}', {\n  query: \`${q.query}\`,\n  variables: ${vars},\n})`
    case 'node':
      return `const fetch = require('node-fetch')\nfetch('{endpoint}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ query: \`${q.query}\`, variables: ${vars} }),\n})`
  }
}

function CopyDropdown({ q, onCopied }: { q: GqlQueryDoc; onCopied: () => void }) {
  const { copied, copy } = useCopyToClipboard()
  const [open, setOpen] = useState(false)

  const doCopy = async (format: CopyFormat) => {
    await copy(buildCopyText(format, q))
    onCopied()
    setOpen(false)
  }

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-zinc-500 hover:text-zinc-200 rounded-r-none border-r border-zinc-800"
            onClick={() => void doCopy('query')}
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy query</TooltipContent>
      </Tooltip>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-6 p-0 text-zinc-500 hover:text-zinc-200 rounded-l-none">
            <ChevronDown size={11} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#18181b] border-zinc-700 text-zinc-200 w-40">
          <DropdownMenuItem onClick={() => void doCopy('query')} className="cursor-pointer hover:bg-zinc-800 font-mono text-xs">Copy Query</DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem onClick={() => void doCopy('curl')} className="cursor-pointer hover:bg-zinc-800 font-mono text-xs">as cURL</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void doCopy('fetch')} className="cursor-pointer hover:bg-zinc-800 font-mono text-xs">as fetch</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void doCopy('axios')} className="cursor-pointer hover:bg-zinc-800 font-mono text-xs">as axios</DropdownMenuItem>
          <DropdownMenuItem onClick={() => void doCopy('node')} className="cursor-pointer hover:bg-zinc-800 font-mono text-xs">as Node.js</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function parseVariables(vars?: string): Record<string, unknown> {
  if (!vars || !vars.trim()) return {}
  try { return JSON.parse(vars) as Record<string, unknown> } catch { return {} }
}

function GqlCard({ q, spaceSlug, onMutate: _onMutate }: { q: GqlQueryDoc; spaceSlug: string; onMutate: () => void }) {
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState(q.projectName)
  const [editName, setEditName] = useState(q.name)
  const [editQuery, setEditQuery] = useState(q.query)
  const [editVars, setEditVars] = useState(q.variables ?? '')
  const [varsError, setVarsError] = useState('')

  const handleToggleFav = useCallback(() => {
    const newFav = !q.isFavorite
    qc.setQueryData<GqlQueryDoc[]>(['graphql', spaceSlug], (old = []) =>
      old.map((item) => item._id === q._id ? { ...item, isFavorite: newFav } : item)
    )
    void toggleGqlFavorite(q._id, newFav)
  }, [q._id, q.isFavorite, qc, spaceSlug])

  const handleDelete = useCallback(() => {
    qc.setQueryData<GqlQueryDoc[]>(['graphql', spaceSlug], (old = []) =>
      old.filter((item) => item._id !== q._id)
    )
    void deleteQuery(q._id)
  }, [q._id, qc, spaceSlug])

  const handleUsage = useCallback(() => {
    void incrementGqlUsage(q._id, q.usageCount)
  }, [q._id, q.usageCount])

  const handleEditSave = useCallback(async () => {
    if (editVars.trim()) {
      try { JSON.parse(editVars) } catch { setVarsError('Invalid JSON'); return }
    }
    setVarsError('')
    qc.setQueryData<GqlQueryDoc[]>(['graphql', spaceSlug], (old = []) =>
      old.map((item) => item._id === q._id ? { ...item, projectName: editProject, name: editName, query: editQuery, variables: editVars } : item)
    )
    setEditOpen(false)
    void updateQuery(q._id, editProject, editName, editQuery, editVars)
  }, [editProject, editName, editQuery, editVars, q._id, qc, spaceSlug])

  const parsedVars = parseVariables(q.variables)
  const firstLines = q.query.trim().split('\n').slice(0, 3).join('\n')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="px-4 py-3 bg-[#18181b] border border-zinc-800/60 rounded-lg hover:border-zinc-700/60 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-zinc-200 font-medium">{q.name}</span>
            <span className="text-xs text-zinc-500">{q.projectName}</span>
          </div>
          <pre className="font-mono text-xs text-zinc-600 opacity-60 overflow-hidden leading-relaxed">
            {firstLines}
          </pre>
          {Object.keys(parsedVars).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(parsedVars).map(([k, v]) => (
                <span key={k} className="text-xs font-mono">
                  <span className="text-zinc-500">{k}:</span>{' '}
                  <span className="text-zinc-400">
                    {isSensitiveKey(k) ? maskValue(String(v)) : String(v)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyDropdown q={q} onCopied={handleUsage} />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm" variant="ghost"
                className={`h-7 w-7 p-0 ${q.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`}
                onClick={handleToggleFav}
              >
                <Star size={13} fill={q.isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{q.isFavorite ? 'Unfavorite' : 'Favorite'}</TooltipContent>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
          <DialogHeader><DialogTitle className="text-zinc-100">Edit Query</DialogTitle></DialogHeader>
          <QueryForm
            project={editProject} setProject={setEditProject}
            name={editName} setName={setEditName}
            query={editQuery} setQuery={setEditQuery}
            vars={editVars} setVars={setEditVars}
            varsError={varsError}
            onSave={handleEditSave}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function QueryForm({
  project, setProject, name, setName, query, setQuery,
  vars, setVars, varsError, onSave, onCancel, saving,
}: {
  project: string; setProject: (v: string) => void
  name: string; setName: (v: string) => void
  query: string; setQuery: (v: string) => void
  vars: string; setVars: (v: string) => void
  varsError: string
  onSave: () => void
  onCancel: () => void
  saving?: boolean
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Project</Label>
          <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="my-app" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Get User" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Query</Label>
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="query GetUser { ... }"
          className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[150px] resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Variables (JSON)</Label>
        <Textarea
          value={vars}
          onChange={(e) => setVars(e.target.value)}
          onBlur={() => {
            if (vars.trim()) {
              try { JSON.parse(vars) } catch { /* will show error on save */ }
            }
          }}
          placeholder='{"id": "123"}'
          className={`bg-zinc-900 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[60px] resize-y ${varsError ? 'border-red-500' : ''}`}
        />
        {varsError && <p className="text-red-400 text-xs">{varsError}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} className="text-zinc-400">Cancel</Button>
        <Button onClick={onSave} disabled={saving || !project.trim() || !name.trim() || !query.trim()} className="bg-[--accent] hover:opacity-90 text-white border-0">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function AddQueryDialog({ spaceSlug, onCreated: _onCreated }: { spaceSlug: string; onCreated: () => void }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState('')
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [vars, setVars] = useState('')
  const [varsError, setVarsError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (vars.trim()) {
      try { JSON.parse(vars) } catch { setVarsError('Invalid JSON'); return }
    }
    setVarsError('')
    setSaving(true)
    try {
      // Optimistic update — item appears immediately
      const tempQuery: GqlQueryDoc = {
        _id: `opt-${Date.now()}`,
        _type: 'gqlQuery',
        spaceSlug,
        projectName: project,
        name,
        query,
        variables: vars || undefined,
        isFavorite: false,
        usageCount: 0,
      }
      qc.setQueryData<GqlQueryDoc[]>(['graphql', spaceSlug], (old = []) => [...old, tempQuery])

      // Close dialog immediately
      setOpen(false)
      setProject(''); setName(''); setQuery(''); setVars('')
      setSaving(false)

      // Persist in background
      void createQuery(spaceSlug, project, name, query, vars)
    } catch (err) {
      console.error('Failed to create query:', err)
      setSaving(false)
    }
  }, [spaceSlug, project, name, query, vars, qc])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-[--accent] hover:opacity-90 text-white border-0">
          <Plus size={14} /> Add Query
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-zinc-100">Add GraphQL Query</DialogTitle></DialogHeader>
        <QueryForm
          project={project} setProject={setProject}
          name={name} setName={setName}
          query={query} setQuery={setQuery}
          vars={vars} setVars={setVars}
          varsError={varsError}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
          saving={saving}
        />
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

export function GraphQLSection({ spaceSlug }: Props) {
  const qc = useQueryClient()
  const { data: queries = [], isLoading } = useQuery({
    queryKey: ['graphql', spaceSlug],
    queryFn: () => getGqlQueries(spaceSlug),
    refetchOnWindowFocus: true,
  })

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['graphql', spaceSlug] })
  }, [qc, spaceSlug])

  const favorites = queries.filter((q) => q.isFavorite)
  const topUsed = queries.filter((q) => !q.isFavorite).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5)
  const byProject: Record<string, GqlQueryDoc[]> = {}
  for (const q of queries) {
    if (!byProject[q.projectName]) byProject[q.projectName] = []
    byProject[q.projectName]!.push(q)
  }

  return (
    <SectionPageShell
      title="GraphQL"
      description="Save queries. Copy as query, cURL, fetch, axios, or Node.js."
      action={<AddQueryDialog spaceSlug={spaceSlug} onCreated={refresh} />}
    >
      {isLoading ? (
        <div className="text-zinc-600 text-sm">Loading…</div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500 text-sm">No queries saved yet</p>
          <AddQueryDialog spaceSlug={spaceSlug} onCreated={refresh} />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {favorites.length > 0 && (
            <div>
              <SectionHeader label="⭐ Favorites" />
              <div className="space-y-2">
                <AnimatePresence>
                  {favorites.map((q) => <GqlCard key={q._id} q={q} spaceSlug={spaceSlug} onMutate={refresh} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {topUsed.length > 0 && (
            <div>
              <SectionHeader label="🔥 Top Used" />
              <div className="space-y-2">
                <AnimatePresence>
                  {topUsed.map((q) => <GqlCard key={q._id} q={q} spaceSlug={spaceSlug} onMutate={refresh} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          <div>
            <SectionHeader label="📁 All Queries" />
            <div className="space-y-4">
              {Object.entries(byProject).map(([project, qs]) => (
                <div key={project}>
                  <p className="text-xs text-zinc-500 mb-2">{project}</p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {qs.map((q) => <GqlCard key={q._id} q={q} spaceSlug={spaceSlug} onMutate={refresh} />)}
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
