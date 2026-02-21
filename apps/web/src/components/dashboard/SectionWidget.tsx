"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface SectionWidgetProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  href: string;
  children: React.ReactNode;
}

export function SectionWidget({ title, icon, count, href, children }: SectionWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-[200px] rounded-lg border border-zinc-800 bg-[var(--bg-card)]"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-sm font-medium text-zinc-100">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-400">
              {count}
            </span>
          )}
        </div>
        <Link
          href={href}
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          View all →
        </Link>
      </div>
      <div className="p-4">
        {count === 0 ? (
          <Link
            href={href}
            className="flex h-24 items-center justify-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Add first →
          </Link>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
