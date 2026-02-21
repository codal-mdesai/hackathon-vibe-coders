"use client";

interface SectionPageShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionPageShell({ title, actions, children }: SectionPageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[var(--bg-page)]/80 px-6 backdrop-blur-sm">
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</div>
    </div>
  );
}
