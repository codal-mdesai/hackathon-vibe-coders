import { ReactNode } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'

type SectionWidgetProps = {
  title: string
  icon: ReactNode
  count: number
  href: string
  loading?: boolean
  children?: ReactNode
  emptyLabel?: string
  emptyHref?: string
}

export function SectionWidget({
  title,
  icon,
  count,
  href,
  loading = false,
  children,
  emptyLabel,
  emptyHref,
}: SectionWidgetProps) {
  return (
    <Card className="bg-[#18181b] border-zinc-800/60 min-h-[200px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-800/40">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-zinc-500">{icon}</span>
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-zinc-600 font-mono">({count})</span>
        </div>
        <Link
          href={href}
          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3 space-y-1">
        {loading ? (
          <>
            <Skeleton className="h-9 w-full bg-zinc-800/60" />
            <Skeleton className="h-9 w-full bg-zinc-800/60" />
            <Skeleton className="h-9 w-full bg-zinc-800/60" />
          </>
        ) : count === 0 ? (
          <div className="h-full flex items-center justify-center py-6">
            {emptyHref ? (
              <Link
                href={emptyHref}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
              >
                {emptyLabel ?? `Add first ${title.toLowerCase()} →`}
              </Link>
            ) : (
              <p className="text-xs text-zinc-600">{emptyLabel ?? `No ${title.toLowerCase()} yet`}</p>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}
