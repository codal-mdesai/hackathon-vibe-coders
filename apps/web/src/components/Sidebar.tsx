'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSpace, ACCENT_SWATCHES } from '@/providers/SpaceProvider'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Key,
  Variable,
  Braces,
  Pin,
  FileText,
  Webhook,
  FileJson,
  LogIn,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  countKey?: keyof ReturnType<typeof useSpace>['counts']
}

function useNavItems(slug: string): NavItem[] {
  return [
    {
      label: 'Dashboard',
      href: `/space/${slug}`,
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: 'API Keys',
      href: `/space/${slug}/api-keys`,
      icon: <Key size={16} />,
      countKey: 'apiKeys',
    },
    {
      label: 'Env Variables',
      href: `/space/${slug}/env-vars`,
      icon: <Variable size={16} />,
      countKey: 'envVars',
    },
    {
      label: 'GraphQL',
      href: `/space/${slug}/graphql`,
      icon: <Braces size={16} />,
      countKey: 'graphql',
    },
    {
      label: 'Pinboard',
      href: `/space/${slug}/pinboard`,
      icon: <Pin size={16} />,
      countKey: 'pins',
    },
    {
      label: 'Deploy Notes',
      href: `/space/${slug}/deploy-notes`,
      icon: <FileText size={16} />,
      countKey: 'deployNotes',
    },
    {
      label: 'Webhooks',
      href: `/space/${slug}/webhooks`,
      icon: <Webhook size={16} />,
      countKey: 'webhooks',
    },
    {
      label: 'JSON + CURL',
      href: `/space/${slug}/payloads`,
      icon: <FileJson size={16} />,
      countKey: 'payloads',
    },
  ]
}

function SpaceNameEditor() {
  const { displayName, updateName } = useSpace()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(displayName)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = async () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== displayName) {
      await updateName(trimmed)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="w-full bg-transparent text-sm font-semibold text-zinc-100 outline-none border-b border-zinc-600 pb-0.5"
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={() => {
        setValue(displayName)
        setEditing(true)
      }}
      className="text-sm font-semibold text-zinc-100 hover:text-white truncate text-left w-full"
    >
      {displayName}
    </button>
  )
}

function AccentSwatches() {
  const { accentColor, updateAccent } = useSpace()

  return (
    <div className="flex gap-1.5 flex-wrap">
      {ACCENT_SWATCHES.map((color) => (
        <Tooltip key={color}>
          <TooltipTrigger asChild>
            <button
              onClick={() => void updateAccent(color)}
              className="w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none"
              style={{
                backgroundColor: color,
                boxShadow: accentColor === color ? `0 0 0 2px #0a0a0a, 0 0 0 3px ${color}` : 'none',
              }}
              aria-label={`Set accent color ${color}`}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">{color}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { slug, counts } = useSpace()
  const navItems = useNavItems(slug)

  const isActive = (href: string) => {
    if (href === `/space/${slug}`) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0a0a0a] border-r border-zinc-800/60">
      {/* Space header */}
      <div className="p-4 border-b border-zinc-800/60 space-y-3">
        <SpaceNameEditor />
        <AccentSwatches />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const count = item.countKey ? counts[item.countKey] : undefined

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-4 py-2 text-sm transition-colors relative
                ${active
                  ? 'text-white bg-zinc-800/50'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30'
                }
              `}
              style={
                active
                  ? { borderLeft: '3px solid var(--accent)', paddingLeft: '13px' }
                  : { borderLeft: '3px solid transparent', paddingLeft: '13px' }
              }
            >
              <span className={active ? 'text-white' : 'text-zinc-500'}>{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {count !== undefined && count > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 bg-zinc-800 text-zinc-400 border-0 font-mono"
                >
                  {count}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: sign in */}
      <div className="p-4 border-t border-zinc-800/60">
        <Link
          href="/auth/signin"
          className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <LogIn size={12} />
          Sign in
        </Link>
      </div>
    </aside>
  )
}
