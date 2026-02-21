"use client";

import { useEffect, useState } from "react";
import { useSpace } from "@/components/SpaceProvider";
import { SectionWidget } from "@/components/dashboard/SectionWidget";
import { maskValue } from "@/lib/mask";
import {
  KeyRound,
  Variable,
  Braces,
  Pin,
  FileText,
  Webhook,
  Send,
} from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums text-zinc-500">
      {time.toLocaleTimeString()}
    </span>
  );
}

interface DashboardRow {
  id: string;
  label: string;
  sub: string;
  masked?: string;
}

function CompactRow({ row }: { row: DashboardRow }) {
  return (
    <div className="flex h-9 items-center gap-3 rounded px-2 text-sm transition-colors hover:bg-zinc-800/50">
      <span className="flex-1 truncate text-zinc-200">{row.label}</span>
      <span className="truncate text-xs text-zinc-500">{row.sub}</span>
      {row.masked && (
        <span className="font-mono text-xs text-zinc-600">{row.masked}</span>
      )}
    </div>
  );
}

function EmptyRows() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-9 animate-pulse rounded bg-zinc-800/30" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { slug, displayName, counts } = useSpace();

  const sections = [
    {
      title: "API Keys",
      icon: <KeyRound className="h-4 w-4" />,
      count: counts.apiKeys,
      href: `/space/${slug}/api-keys`,
      rows: [] as DashboardRow[],
    },
    {
      title: "Env Variables",
      icon: <Variable className="h-4 w-4" />,
      count: counts.envVars,
      href: `/space/${slug}/env-vars`,
      rows: [] as DashboardRow[],
    },
    {
      title: "GraphQL",
      icon: <Braces className="h-4 w-4" />,
      count: counts.graphql,
      href: `/space/${slug}/graphql`,
      rows: [] as DashboardRow[],
    },
    {
      title: "Pinboard",
      icon: <Pin className="h-4 w-4" />,
      count: counts.pins,
      href: `/space/${slug}/pinboard`,
      rows: [] as DashboardRow[],
    },
    {
      title: "Deploy Notes",
      icon: <FileText className="h-4 w-4" />,
      count: counts.deployNotes,
      href: `/space/${slug}/deploy-notes`,
      rows: [] as DashboardRow[],
    },
    {
      title: "Webhooks",
      icon: <Webhook className="h-4 w-4" />,
      count: counts.webhooks,
      href: `/space/${slug}/webhooks`,
      rows: [] as DashboardRow[],
    },
    {
      title: "Payloads",
      icon: <Send className="h-4 w-4" />,
      count: counts.payloads,
      href: `/space/${slug}/payloads`,
      rows: [] as DashboardRow[],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[var(--bg-page)]/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">
            {getGreeting()}
          </h1>
          <span className="text-lg text-zinc-500">·</span>
          <span className="text-sm text-zinc-400">{displayName}</span>
        </div>
        <LiveClock />
      </header>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <SectionWidget
              key={s.title}
              title={s.title}
              icon={s.icon}
              count={s.count}
              href={s.href}
            >
              {s.rows.length > 0 ? (
                <div className="space-y-0.5">
                  {s.rows.map((row) => (
                    <CompactRow key={row.id} row={row} />
                  ))}
                </div>
              ) : (
                <EmptyRows />
              )}
            </SectionWidget>
          ))}
        </div>
        <div className="mt-6 text-center text-xs text-zinc-600">
          Press{" "}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
            ⌘K
          </kbd>{" "}
          to search across all sections
        </div>
      </div>
    </div>
  );
}
