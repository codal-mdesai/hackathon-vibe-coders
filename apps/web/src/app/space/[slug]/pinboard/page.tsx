"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { fetchPins } from "@/sanity/queries/pins";
import { createPin, deletePin, fetchPageTitle } from "@/actions/pinboard";
import type { PinItem } from "@/types/sanity";
import { Plus, Trash2, ExternalLink, X } from "lucide-react";

const PIN_COLORS = [
  { name: "zinc", value: "#71717a" },
  { name: "violet", value: "#8b5cf6" },
  { name: "blue", value: "#3b82f6" },
  { name: "green", value: "#22c55e" },
  { name: "amber", value: "#f59e0b" },
  { name: "red", value: "#ef4444" },
] as const;

export default function PinboardPage() {
  const { slug, displayName } = useSpace();
  const [pins, setPins] = useState<PinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchPins(slug);
    setPins(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setPins((prev) => prev.filter((p) => p._id !== id));
    await deletePin(id);
  }

  return (
    <SectionPageShell title="Pinboard">
      {loading ? (
        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="mb-4 h-32 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No pins yet. Add your first link.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add first pin
          </button>
        </div>
      ) : (
        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {pins.map((pin, i) => (
            <motion.div
              key={pin._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="group mb-4 break-inside-avoid rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5"
              style={{ borderLeftWidth: "3px", borderLeftColor: pin.color }}
            >
              <a
                href={pin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zinc-200 hover:text-white"
              >
                <span className="truncate">{pin.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
              </a>
              <div className="mb-2 truncate font-mono text-xs text-zinc-500">{pin.url}</div>
              {pin.tags && pin.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {pin.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  Added by {pin.addedBy || "Anonymous"}
                </span>
                <button
                  onClick={() => handleDelete(pin._id)}
                  className="rounded p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <Plus className="h-5 w-5 text-white" />
      </button>

      <AnimatePresence>
        {showAdd && (
          <AddPinPopover
            slug={slug}
            displayName={displayName}
            onClose={() => setShowAdd(false)}
            onCreated={load}
          />
        )}
      </AnimatePresence>
    </SectionPageShell>
  );
}

function AddPinPopover({
  slug,
  displayName,
  onClose,
  onCreated,
}: {
  slug: string;
  displayName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("#71717a");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function handleUrlBlur() {
    if (!url.trim() || title.trim()) return;
    setFetching(true);
    const pageTitle = await fetchPageTitle(url);
    if (pageTitle) setTitle(pageTitle);
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;
    setSaving(true);
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await createPin(slug, url.trim(), title.trim(), tagList, displayName, color);
    onCreated();
    onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Add Pin</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://..."
            />
          </div>
          <div>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={fetching ? "Fetching title…" : "Title"}
            />
          </div>
          <div>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-zinc-500"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated)"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Color:</span>
            {PIN_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className="h-5 w-5 rounded-full transition-transform hover:scale-125"
                style={{
                  backgroundColor: c.value,
                  outline: color === c.value ? "2px solid" : "none",
                  outlineColor: c.value,
                  outlineOffset: "2px",
                }}
                onClick={() => setColor(c.value)}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !url.trim() || !title.trim()}
            className="w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Pin it"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
