"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  KeyRound,
  Variable,
  Braces,
  Pin,
  FileText,
  Webhook,
  Send,
  LayoutDashboard,
} from "lucide-react";

const ACCENT_SWATCHES = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
] as const;

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  countKey: string;
}

function getNavItems(slug: string): NavItem[] {
  return [
    { label: "Dashboard", href: `/space/${slug}`, icon: LayoutDashboard, countKey: "" },
    { label: "API Keys", href: `/space/${slug}/api-keys`, icon: KeyRound, countKey: "apiKeys" },
    { label: "Env Variables", href: `/space/${slug}/env-vars`, icon: Variable, countKey: "envVars" },
    { label: "GraphQL", href: `/space/${slug}/graphql`, icon: Braces, countKey: "graphql" },
    { label: "Pinboard", href: `/space/${slug}/pinboard`, icon: Pin, countKey: "pins" },
    { label: "Deploy Notes", href: `/space/${slug}/deploy-notes`, icon: FileText, countKey: "deployNotes" },
    { label: "Webhooks", href: `/space/${slug}/webhooks`, icon: Webhook, countKey: "webhooks" },
    { label: "Payloads", href: `/space/${slug}/payloads`, icon: Send, countKey: "payloads" },
  ];
}

export function Sidebar({
  counts,
  spaceName,
  onNameChange,
}: {
  counts: Record<string, number>;
  spaceName: string;
  onNameChange: (name: string) => void;
}) {
  const pathname = usePathname();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const items = getNavItems(slug);

  const [accent, setAccent] = useState("#3b82f6");
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(spaceName);

  useEffect(() => {
    const stored = localStorage.getItem(`devpanel_accent_${slug}`);
    if (stored) {
      setAccent(stored);
      document.documentElement.style.setProperty("--accent", stored);
    }
  }, [slug]);

  useEffect(() => {
    setNameValue(spaceName);
  }, [spaceName]);

  function pickAccent(color: string) {
    setAccent(color);
    localStorage.setItem(`devpanel_accent_${slug}`, color);
    document.documentElement.style.setProperty("--accent", color);
  }

  function commitName() {
    setEditing(false);
    if (nameValue.trim() && nameValue !== spaceName) {
      onNameChange(nameValue.trim());
    }
  }

  function isActive(href: string) {
    if (href === `/space/${slug}`) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800 bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-4">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {editing ? (
          <input
            className="flex-1 border-b border-zinc-600 bg-transparent text-sm text-zinc-100 outline-none"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()}
            autoFocus
          />
        ) : (
          <button
            className="flex-1 truncate text-left text-sm font-medium text-zinc-100 hover:text-white"
            onClick={() => setEditing(true)}
          >
            {spaceName || "My Space"}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const count = item.countKey ? counts[item.countKey] ?? 0 : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-l-[3px] text-white"
                  : "border-l-[3px] border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
              style={active ? { borderLeftColor: "var(--accent)" } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {count !== null && count > 0 && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-400">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ACCENT_SWATCHES.map((color) => (
            <button
              key={color}
              className="h-4 w-4 rounded-full transition-transform hover:scale-125"
              style={{
                backgroundColor: color,
                outline: accent === color ? "2px solid" : "none",
                outlineColor: color,
                outlineOffset: "2px",
              }}
              onClick={() => pickAccent(color)}
            />
          ))}
        </div>
        <Link
          href="/sign-in"
          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Sign in
        </Link>
      </div>
    </aside>
  );
}
