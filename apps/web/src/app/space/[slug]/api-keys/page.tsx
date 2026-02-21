"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useEncryption } from "@/hooks/useEncryption";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { maskValue } from "@/lib/mask";
import { fetchApiKeys } from "@/sanity/queries/api-keys";
import {
  createApiKey,
  deleteApiKey,
  toggleFavorite,
  incrementUsage,
} from "@/actions/api-keys";
import type { ApiKeyGroup } from "@/types/sanity";
import {
  Star,
  Copy,
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

export default function ApiKeysPage() {
  const { slug } = useSpace();
  const { encryptValue, decryptValue } = useEncryption();
  const { copied, copy } = useCopyToClipboard();
  const [groups, setGroups] = useState<ApiKeyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchApiKeys(slug);
    setGroups(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const allKeys = groups.flatMap((g) =>
    g.keys.map((k) => ({ ...k, storeName: g.storeName, groupId: g._id })),
  );
  const favorites = allKeys.filter((k) => k.isFavorite);
  const topUsage = [...allKeys]
    .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
    .slice(0, 5);

  async function handleCopy(groupId: string, keyId: string, encryptedValue: string) {
    const plain = await decryptValue(encryptedValue);
    await copy(plain);
    incrementUsage(groupId, keyId).catch(() => {});
  }

  async function handleToggleFav(groupId: string, keyId: string, current: boolean) {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, keys: g.keys.map((k) => (k.id === keyId ? { ...k, isFavorite: !current } : k)) }
          : g,
      ),
    );
    await toggleFavorite(groupId, keyId, !current);
  }

  async function handleDelete(groupId: string, keyId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, keys: g.keys.filter((k) => k.id !== keyId) }
          : g,
      ),
    );
    await deleteApiKey(groupId, keyId);
  }

  return (
    <SectionPageShell
      title="API Keys"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Key
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : allKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No API keys saved yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add your first key
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <Section title="⭐ Favorites">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {favorites.map((k) => (
                  <KeyCard
                    key={k.id}
                    item={k}
                    onCopy={() => handleCopy(k.groupId, k.id, k.encryptedValue)}
                    onToggleFav={() => handleToggleFav(k.groupId, k.id, k.isFavorite)}
                    onDelete={() => handleDelete(k.groupId, k.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          )}
          {topUsage.length > 0 && (
            <Section title="🔥 Most Used">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {topUsage.map((k) => (
                  <KeyCard
                    key={k.id}
                    item={k}
                    onCopy={() => handleCopy(k.groupId, k.id, k.encryptedValue)}
                    onToggleFav={() => handleToggleFav(k.groupId, k.id, k.isFavorite)}
                    onDelete={() => handleDelete(k.groupId, k.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          )}
          {groups.map((g) => (
            <Section key={g._id} title={`📁 ${g.storeName}`}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {g.keys.map((k) => (
                  <KeyCard
                    key={k.id}
                    item={{ ...k, storeName: g.storeName, groupId: g._id }}
                    onCopy={() => handleCopy(g._id, k.id, k.encryptedValue)}
                    onToggleFav={() => handleToggleFav(g._id, k.id, k.isFavorite)}
                    onDelete={() => handleDelete(g._id, k.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddKeyDialog
            slug={slug}
            encryptValue={encryptValue}
            groups={groups}
            onClose={() => setShowAdd(false)}
            onCreated={load}
          />
        )}
      </AnimatePresence>
    </SectionPageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">{title}</h2>
      {children}
    </div>
  );
}

function KeyCard({
  item,
  onCopy,
  onToggleFav,
  onDelete,
  copied,
}: {
  item: { id: string; label: string; encryptedValue: string; isFavorite: boolean; storeName: string; groupId: string; usageCount: number };
  onCopy: () => void;
  onToggleFav: () => void;
  onDelete: () => void;
  copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-1 text-xs text-zinc-500">{item.storeName}</div>
      <div className="mb-2 text-sm font-medium text-zinc-200">{item.label}</div>
      <div className="font-mono text-xs text-zinc-600">{maskValue(item.encryptedValue)}</div>
      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={onToggleFav}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
        >
          <Star className={`h-3.5 w-3.5 ${item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-3 top-12 z-20 rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-800"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddKeyDialog({
  slug,
  encryptValue,
  groups,
  onClose,
  onCreated,
}: {
  slug: string;
  encryptValue: (v: string) => Promise<string>;
  groups: ApiKeyGroup[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [storeName, setStoreName] = useState("");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingStores = [...new Set(groups.map((g) => g.storeName))];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName.trim() || !label.trim() || !value.trim()) return;
    setSaving(true);
    const encrypted = await encryptValue(value);
    await createApiKey(slug, storeName.trim(), label.trim(), encrypted);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-md rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Add API Key</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Store Name</label>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              list="stores"
              placeholder="e.g. AWS, Stripe, GitHub"
            />
            <datalist id="stores">
              {existingStores.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Label</label>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production API Key"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Value</label>
            <div className="relative">
              <input
                type={showValue ? "text" : "password"}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 pr-10 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !storeName.trim() || !label.trim() || !value.trim()}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Encrypting & Saving…" : "Save Key"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
