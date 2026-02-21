'use client'

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { isSensitiveKey, maskValue } from '@/lib/mask'
import type { WebhookDoc, JsonPayloadDoc, CurlCommandDoc } from '@/types/sanity'

type Props = {
  resourceType: string
  resourceData: unknown
  expiresAt: string
}

function WebhookView({ w }: { w: WebhookDoc }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-1">Webhook</p>
        <h2 className="text-lg font-semibold text-zinc-100">{w.name}</h2>
        <p className="text-xs text-zinc-500">{w.projectName}</p>
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">URL</p>
        <code className="text-sm font-mono text-zinc-300 break-all">{w.url}</code>
      </div>
      {w.headers.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Headers</p>
          <div className="space-y-1">
            {w.headers.map((h) => (
              <div key={h._key} className="flex gap-2 text-xs font-mono">
                <span className="text-zinc-500">{h.key}:</span>
                <span className="text-zinc-300">{isSensitiveKey(h.key) ? maskValue(h.value) : h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {w.payload && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-zinc-500">Payload</p>
            <Button size="sm" variant="ghost" className="h-6 gap-1 text-zinc-500 hover:text-zinc-200 text-xs" onClick={() => void copy(w.payload ?? '')}>
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              Copy
            </Button>
          </div>
          <pre className="font-mono text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-lg overflow-auto">{w.payload}</pre>
        </div>
      )}
    </div>
  )
}

function JsonPayloadView({ j }: { j: JsonPayloadDoc }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-1">JSON Payload</p>
        <h2 className="text-lg font-semibold text-zinc-100">{j.name}</h2>
        <p className="text-xs text-zinc-500">{j.projectName}</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-zinc-500">Payload</p>
          <Button size="sm" variant="ghost" className="h-6 gap-1 text-zinc-500 hover:text-zinc-200 text-xs" onClick={() => void copy(j.payload)}>
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            Copy
          </Button>
        </div>
        <pre className="font-mono text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-lg overflow-auto">{j.payload}</pre>
      </div>
    </div>
  )
}

function CurlView({ c }: { c: CurlCommandDoc }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-1">CURL Command</p>
        <h2 className="text-lg font-semibold text-zinc-100">{c.label}</h2>
        <p className="text-xs text-zinc-500">{c.category}</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-zinc-500">Command</p>
          <Button size="sm" variant="ghost" className="h-6 gap-1 text-zinc-500 hover:text-zinc-200 text-xs" onClick={() => void copy(c.command)}>
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            Copy
          </Button>
        </div>
        <pre className="font-mono text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-lg overflow-auto">{c.command}</pre>
      </div>
    </div>
  )
}

export function ShareReadOnlyView({ resourceType, resourceData, expiresAt }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-500">DevPanel Share</span>
          </div>
          <span className="text-xs text-zinc-600">
            Expires {new Date(expiresAt).toLocaleString()}
          </span>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl p-6">
          {resourceType === 'webhook' && resourceData != null && (
            <WebhookView w={resourceData as WebhookDoc} />
          )}
          {resourceType === 'jsonPayload' && resourceData != null && (
            <JsonPayloadView j={resourceData as JsonPayloadDoc} />
          )}
          {resourceType === 'curlCommand' && resourceData != null && (
            <CurlView c={resourceData as CurlCommandDoc} />
          )}
          {!resourceData && (
            <p className="text-zinc-500 text-sm">Resource not found or inaccessible.</p>
          )}
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">Read-only view · No sign-in required</p>
      </div>
    </div>
  )
}
