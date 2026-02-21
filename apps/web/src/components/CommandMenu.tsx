"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
    setQuery("");
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
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                placeholder="Search across all sections…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {query.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  Type to search across all sections…
                </div>
              ) : (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  Search results will appear here
                </div>
              )}
            </div>
            <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-600">
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">↑↓</kbd>{" "}
              navigate{" "}
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">↵</kbd>{" "}
              select{" "}
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">esc</kbd>{" "}
              close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
