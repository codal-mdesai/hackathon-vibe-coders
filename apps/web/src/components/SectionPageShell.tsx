import { ReactNode } from 'react'

type SectionPageShellProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function SectionPageShell({ title, description, action, children }: SectionPageShellProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Sticky header — 56px */}
      <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 border-b border-zinc-800/60 bg-[#0a0a0a]/95 backdrop-blur-sm flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
          {description && <p className="text-xs text-zinc-500">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </header>

      {/* Scrollable body */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
