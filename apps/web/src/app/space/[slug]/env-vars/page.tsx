"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useEncryption } from "@/hooks/useEncryption";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { maskValue } from "@/lib/mask";
import { fetchEnvVars } from "@/sanity/queries/env-vars";
import {
  createEnvVar,
  deleteEnvVar,
  toggleEnvFavorite,
  updateEnvLastUsed,
} from "@/actions/env-vars";
import type { EnvGroup } from "@/types/sanity";
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

export default function EnvVarsPage() {
  const { slug } = useSpace();
  const { encryptValue, decryptValue } = useEncryption();
  const { copied, copy } = useCopyToClipboard();
  const [groups, setGroups] = useState<EnvGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchEnvVars(slug);
    setGroups(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const allVars = groups.flatMap((g) =>
    g.vars.map((v) => ({ ...v, projectName: g.projectName, groupId: g._id })),
  );
  const favorites = allVars.filter((v) => v.isFavorite);
  const recentlyUsed = [...allVars]
    .filter((v) => v.lastUsed)
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 5);

  async function handleCopy(groupId: string, varId: string, key: string, encryptedValue: string) {
    const plain = await decryptValue(encryptedValue);
    await copy(`${key}=${plain}`);
    updateEnvLastUsed(groupId, varId).catch(() => {});
  }

  async function handleToggleFav(groupId: string, varId: string, current: boolean) {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, vars: g.vars.map((v) => (v.id === varId ? { ...v, isFavorite: !current } : v)) }
          : g,
      ),
    );
    await toggleEnvFavorite(groupId, varId, !current);
  }

  async function handleDelete(groupId: string, varId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, vars: g.vars.filter((v) => v.id !== varId) }
          : g,
      ),
    );
    await deleteEnvVar(groupId, varId);
  }

  return (
    <SectionPageShell
      title="Env Variables"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Variable
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : allVars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No env variables saved yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add your first variable
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <Section title="⭐ Favorites">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((v) => (
                  <VarCard
                    key={v.id}
                    item={v}
                    onCopy={() => handleCopy(v.groupId, v.id, v.key, v.encryptedValue)}
                    onToggleFav={() => handleToggleFav(v.groupId, v.id, v.isFavorite)}
                    onDelete={() => handleDelete(v.groupId, v.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          )}
          {recentlyUsed.length > 0 && (
            <Section title="🕐 Recently Used">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recentlyUsed.map((v) => (
                  <VarCard
                    key={v.id}
                    item={v}
                    onCopy={() => handleCopy(v.groupId, v.id, v.key, v.encryptedValue)}
                    onToggleFav={() => handleToggleFav(v.groupId, v.id, v.isFavorite)}
                    onDelete={() => handleDelete(v.groupId, v.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          )}
          {groups.map((g) => (
            <Section key={g._id} title={`📁 ${g.projectName}`}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {g.vars.map((v) => (
                  <VarCard
                    key={v.id}
                    item={{ ...v, projectName: g.projectName, groupId: g._id }}
                    onCopy={() => handleCopy(g._id, v.id, v.key, v.encryptedValue)}
                    onToggleFav={() => handleToggleFav(g._id, v.id, v.isFavorite)}
                    onDelete={() => handleDelete(g._id, v.id)}
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
          <AddVarDialog
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

function VarCard({
  item,
  onCopy,
  onToggleFav,
  onDelete,
  copied,
}: {
  item: { id: string; key: string; encryptedValue: string; isFavorite: boolean; projectName: string; groupId: string };
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
      <div className="mb-1 text-xs text-zinc-500">{item.projectName}</div>
      <div className="mb-2 font-mono text-sm font-medium text-zinc-200">{item.key}</div>
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

function AddVarDialog({
  slug,
  encryptValue,
  groups,
  onClose,
  onCreated,
}: {
  slug: string;
  encryptValue: (v: string) => Promise<string>;
  groups: EnvGroup[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingProjects = [...new Set(groups.map((g) => g.projectName))];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim() || !key.trim() || !value.trim()) return;
    setSaving(true);
    const encrypted = await encryptValue(value);
    await createEnvVar(slug, projectName.trim(), key.trim().toUpperCase(), encrypted);
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
          <h2 className="text-lg font-semibold text-zinc-100">Add Env Variable</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Project Name</label>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              list="projects"
              placeholder="e.g. my-app"
            />
            <datalist id="projects">
              {existingProjects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Key</label>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="DATABASE_URL"
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
                placeholder="postgres://..."
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
            disabled={saving || !projectName.trim() || !key.trim() || !value.trim()}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Encrypting & Saving…" : "Save Variable"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
