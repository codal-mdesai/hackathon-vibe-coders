"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, KeyRound, Variable, Braces, Pin, FileText, Webhook, Send } from "lucide-react";
import { useSpace } from "@/components/SpaceProvider";
import { searchAll, type SearchResult } from "@/sanity/queries/search";

const TYPE_ICONS: Record<string, React.ElementType> = {
  apiKeyGroup: KeyRound,
  envGroup: Variable,
  gqlQuery: Braces,
  pin: Pin,
  deployNote: FileText,
  webhook: Webhook,
  jsonPayload: Send,
  curlCommand: Send,
};

const TYPE_LABELS: Record<string, string> = {
  apiKeyGroup: "API Keys",
  envGroup: "Env Vars",
  gqlQuery: "GraphQL",
  pin: "Pinboard",
  deployNote: "Deploy Notes",
  webhook: "Webhooks",
  jsonPayload: "JSON Payloads",
  curlCommand: "CURL Commands",
};

export function CommandMenu() {
  const { slug } = useSpace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
    setQuery("");
    setResults([]);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, toggle]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchAll(slug, query);
      setResults(res);
      setSelectedIdx(0);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, slug]);

  function navigateTo(result: SearchResult) {
    setOpen(false);
    router.push(`/space/${slug}/${result.href}#${result._id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      navigateTo(results[selectedIdx]);
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const section = TYPE_LABELS[r._type] ?? r._type;
    if (!acc[section]) acc[section] = [];
    acc[section]!.push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg rounded-xl border border-zinc-800 bg-[var(--bg-card)] shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                placeholder="Search across all sections…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {searching && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {query.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  Type to search across all sections…
                </div>
              ) : results.length === 0 && !searching ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                Object.entries(grouped).map(([section, items]) => (
                  <div key={section} className="mb-2">
                    <div className="px-3 py-1 text-xs font-medium text-zinc-500">
                      {section}
                    </div>
                    {items.map((result) => {
                      flatIndex++;
                      const isSelected = flatIndex === selectedIdx;
                      const Icon = TYPE_ICONS[result._type] ?? Search;
                      const idx = flatIndex;
                      return (
                        <button
                          key={`${result._id}-${idx}`}
                          onClick={() => navigateTo(result)}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? "bg-zinc-800 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-800/50"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{result.label}</span>
                          <span className="truncate text-xs text-zinc-600">
                            {result.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-600">
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                ↑↓
              </kbd>{" "}
              navigate{" "}
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                ↵
              </kbd>{" "}
              select{" "}
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                esc
              </kbd>{" "}
              close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
