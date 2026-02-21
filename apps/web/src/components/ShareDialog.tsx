'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Copy, Check, Share2 } from 'lucide-react'
import { generateShareLink } from '@/actions/share'
import { formatShareUrl } from '@/lib/share'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

type Props = {
  spaceSlug: string
  resourceType: string
  resourceId: string
  trigger?: React.ReactNode
}

export function ShareDialog({ spaceSlug, resourceType, resourceId, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState(24)
  const [generating, setGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const token = await generateShareLink(spaceSlug, resourceType, resourceId, hours)
      const url = formatShareUrl(token)
      const expires = new Date(Date.now() + hours * 60 * 60 * 1000)
      setShareUrl(url)
      setExpiresAt(expires.toLocaleString())
      await copy(url)
    } catch (err) {
      console.error('Failed to generate share link:', err)
    } finally {
      setGenerating(false)
    }
  }

  const reset = () => {
    setShareUrl(null)
    setExpiresAt(null)
    setHours(24)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200">
            <Share2 size={13} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Share Link</DialogTitle>
        </DialogHeader>
        {!shareUrl ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Valid for how many hours?</Label>
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 24))}
                min={1}
                max={720}
                className="bg-zinc-900 border-zinc-700 text-zinc-100 w-32 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[--accent] hover:opacity-90 text-white border-0 gap-1.5"
              >
                <Share2 size={13} />
                {generating ? 'Generating…' : 'Generate & Copy'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Share URL (copied to clipboard)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-zinc-900 border-zinc-700 text-zinc-300 font-mono text-xs"
                />
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-zinc-500 hover:text-zinc-200 flex-shrink-0" onClick={() => void copy(shareUrl)}>
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </Button>
              </div>
            </div>
            {expiresAt && (
              <p className="text-xs text-zinc-600">Expires {expiresAt}</p>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
