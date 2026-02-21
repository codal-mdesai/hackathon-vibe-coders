'use client'

import Link from 'next/link'
import { useSpace } from '@/providers/SpaceProvider'
import { useEffect, useState } from 'react'
import { SectionWidget } from './SectionWidget'
import { LiveClock } from './LiveClock'
import { PinBoard } from '@/components/pinboard/PinBoard'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { maskValue } from '@/lib/mask'
import { deriveKey, decrypt } from '@/lib/crypto'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, Variable, Braces, FileText,
  Webhook, FileJson, Copy, Check, ExternalLink, ChevronDown,
} from 'lucide-react'
import type { DashboardData } from '@/sanity/queries/dashboard'

type Props = {
  slug: string
  data: DashboardData | null
  loading: boolean
}

function CopyButton({ getValue }: { getValue: () => Promise<string> }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200"
      onClick={async () => {
        const v = await getValue()
        void copy(v)
      }}
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </Button>
  )
}

function ApiKeyRows({ groups, slug }: { groups: DashboardData['apiKeyGroups']; slug: string }) {
  return (
    <>
      {groups.map((g) => {
        const k = g.topKey
        if (!k) return null
        return (
          <div key={g._id} className="flex items-center gap-2 h-9 text-xs">
            <span className="text-zinc-500 truncate max-w-[80px]">{g.storeName}</span>
            <span className="text-zinc-300 flex-1 truncate">{k.label}</span>
            <span className="text-zinc-600 font-mono">{maskValue(k.encryptedValue.slice(-8))}</span>
            <CopyButton
              getValue={async () => {
                const key = await deriveKey(slug)
                return decrypt(k.encryptedValue, key)
              }}
            />
          </div>
        )
      })}
    </>
  )
}

function EnvVarRows({ groups, slug }: { groups: DashboardData['envGroups']; slug: string }) {
  return (
    <>
      {groups.map((g) => {
        const v = g.topVar
        if (!v) return null
        return (
          <div key={g._id} className="flex items-center gap-2 h-9 text-xs">
            <span className="text-zinc-500 truncate max-w-[60px]">{g.projectName}</span>
            <span className="font-mono text-zinc-300 flex-1 truncate">{v.key}</span>
            <span className="text-zinc-600 font-mono">{maskValue(v.encryptedValue.slice(-8))}</span>
            <CopyButton
              getValue={async () => {
                const key = await deriveKey(slug)
                const val = await decrypt(v.encryptedValue, key)
                return `${v.key}=${val}`
              }}
            />
          </div>
        )
      })}
    </>
  )
}

function GqlRows({ queries }: { queries: DashboardData['gqlQueries'] }) {
  return (
    <>
      {queries.map((q) => (
        <div key={q._id} className="flex items-center gap-2 h-9 text-xs">
          <span className="text-zinc-300 flex-1 truncate">{q.name}</span>
          <span className="text-zinc-500 truncate max-w-[80px]">{q.projectName}</span>
          <CopyButton getValue={async () => q.query} />
        </div>
      ))}
    </>
  )
}

function DeployRows({ notes }: { notes: DashboardData['deployNotes'] }) {
  return (
    <>
      {notes.map((n) => {
        const area = n.topArea
        return (
          <div key={n._id} className="flex items-center gap-2 h-9 text-xs">
            <span className="text-zinc-500 truncate max-w-[80px]">{n.projectName}</span>
            <span className="text-zinc-300 flex-1 truncate">{area?.name ?? '—'}</span>
            <span className="text-zinc-600">{area?.commands?.length ?? 0} cmds</span>
          </div>
        )
      })}
    </>
  )
}

function WebhookRows({ webhooks }: { webhooks: DashboardData['webhooks'] }) {
  return (
    <>
      {webhooks.map((w) => (
        <div key={w._id} className="flex items-center gap-2 h-9 text-xs">
          <span className="text-zinc-300 flex-1 truncate">{w.name}</span>
          <span className="text-zinc-500 truncate max-w-[80px] font-mono">
            {(() => { try { return new URL(w.url).hostname } catch { return w.url } })()}
          </span>
          {w.payload && <CopyButton getValue={async () => w.payload ?? ''} />}
        </div>
      ))}
    </>
  )
}

function PayloadRows({ payloads }: { payloads: DashboardData['payloads'] }) {
  const items = [
    ...payloads.json.map((j) => ({ name: j.name, label: j.projectName, type: 'JSON', copy: j.payload })),
    ...payloads.curl.map((c) => ({ name: c.label, label: c.category, type: 'CURL', copy: c.command })),
  ].slice(0, 3)

  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 h-9 text-xs">
          <span className="text-zinc-300 flex-1 truncate">{item.name}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-zinc-800 border-0 text-zinc-500">
            {item.type}
          </Badge>
          <CopyButton getValue={async () => item.copy} />
        </div>
      ))}
    </>
  )
}

function ScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 40) setVisible(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} className="text-zinc-600" />
          </motion.div>
          <span className="text-[10px] text-zinc-700 font-mono">scroll for tools</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function DashboardContent({ slug, data, loading }: Props) {
  const { displayName, setCounts } = useSpace()

  useEffect(() => {
    if (data?.counts) {
      setCounts(data.counts)
    }
  }, [data, setCounts])

  const counts = data?.counts ?? {
    apiKeys: 0, envVars: 0, graphql: 0, pins: 0, deployNotes: 0, webhooks: 0, payloads: 0,
  }

  return (
    <div className="flex flex-col">
      {/* ── ZONE 1: Pinboard Hero (full viewport height) ── */}
      <div className="relative" style={{ height: '100vh' }}>
        <PinBoard spaceSlug={slug} isHero />
        <ScrollIndicator />
      </div>

      {/* ── ZONE 2: Utility Widgets ── */}
      <div className="p-6 space-y-6 bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <LiveClock />
            <h1 className="text-xl font-semibold text-zinc-100 mt-1">{displayName}</h1>
          </div>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionWidget
            title="API Keys"
            icon={<Key size={14} />}
            count={counts.apiKeys}
            href={`/space/${slug}/api-keys`}
            loading={loading}
            emptyHref={`/space/${slug}/api-keys`}
            emptyLabel="Add your first API key →"
          >
            <ApiKeyRows groups={data?.apiKeyGroups ?? []} slug={slug} />
          </SectionWidget>

          <SectionWidget
            title="Env Variables"
            icon={<Variable size={14} />}
            count={counts.envVars}
            href={`/space/${slug}/env-vars`}
            loading={loading}
            emptyHref={`/space/${slug}/env-vars`}
            emptyLabel="Add your first env var →"
          >
            <EnvVarRows groups={data?.envGroups ?? []} slug={slug} />
          </SectionWidget>

          <SectionWidget
            title="GraphQL"
            icon={<Braces size={14} />}
            count={counts.graphql}
            href={`/space/${slug}/graphql`}
            loading={loading}
            emptyHref={`/space/${slug}/graphql`}
            emptyLabel="Save your first query →"
          >
            <GqlRows queries={data?.gqlQueries ?? []} />
          </SectionWidget>

          <SectionWidget
            title="Deploy Notes"
            icon={<FileText size={14} />}
            count={counts.deployNotes}
            href={`/space/${slug}/deploy-notes`}
            loading={loading}
            emptyHref={`/space/${slug}/deploy-notes`}
            emptyLabel="Add deploy commands →"
          >
            <DeployRows notes={data?.deployNotes ?? []} />
          </SectionWidget>

          <SectionWidget
            title="Webhooks"
            icon={<Webhook size={14} />}
            count={counts.webhooks}
            href={`/space/${slug}/webhooks`}
            loading={loading}
            emptyHref={`/space/${slug}/webhooks`}
            emptyLabel="Save your first webhook →"
          >
            <WebhookRows webhooks={data?.webhooks ?? []} />
          </SectionWidget>

          <SectionWidget
            title="JSON + CURL"
            icon={<FileJson size={14} />}
            count={counts.payloads}
            href={`/space/${slug}/payloads`}
            loading={loading}
            emptyHref={`/space/${slug}/payloads`}
            emptyLabel="Save your first payload →"
          >
            <PayloadRows payloads={data?.payloads ?? { json: [], curl: [] }} />
          </SectionWidget>

          <div className="hidden md:block" />
        </div>
      </div>
    </div>
  )
}
