"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { isSensitiveKey, maskValue } from "@/lib/mask";
import { toCurl, toFetch, toAxios, toNodeFetch } from "@/lib/graphql-templates";
import { fetchGraphqlQueries } from "@/sanity/queries/graphql";
import {
  createQuery,
  deleteQuery,
  toggleQueryFavorite,
  incrementQueryUsage,
} from "@/actions/graphql";
import type { GqlQuery } from "@/types/sanity";
import {
  Star,
  Copy,
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";

const COPY_FORMATS = [
  { label: "Query", fn: (q: string, _v: string) => q },
  { label: "as cURL", fn: toCurl },
  { label: "as fetch", fn: toFetch },
  { label: "as axios", fn: toAxios },
  { label: "as Node.js", fn: toNodeFetch },
] as const;

export default function GraphqlPage() {
  const { slug } = useSpace();
  const { copied, copy } = useCopyToClipboard();
  const [queries, setQueries] = useState<GqlQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchGraphqlQueries(slug);
    setQueries(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const favorites = queries.filter((q) => q.isFavorite);
  const topUsage = [...queries]
    .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
    .slice(0, 5);
  const byProject = queries.reduce<Record<string, GqlQuery[]>>((acc, q) => {
    const key = q.projectName || "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(q);
    return acc;
  }, {});

  async function handleCopy(id: string, query: string, variables: string, format: (q: string, v: string) => string) {
    await copy(format(query, variables));
    incrementQueryUsage(id).catch(() => {});
  }

  async function handleToggleFav(id: string, current: boolean) {
    setQueries((prev) =>
      prev.map((q) => (q._id === id ? { ...q, isFavorite: !current } : q)),
    );
    await toggleQueryFavorite(id, !current);
  }

  async function handleDelete(id: string) {
    setQueries((prev) => prev.filter((q) => q._id !== id));
    await deleteQuery(id);
  }

  return (
    <SectionPageShell
      title="GraphQL"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Query
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : queries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No GraphQL queries saved yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add your first query
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <Section title="⭐ Favorites">
              {favorites.map((q) => (
                <QueryCard
                  key={q._id}
                  item={q}
                  onCopy={(fmt) => handleCopy(q._id, q.query, q.variables, fmt)}
                  onToggleFav={() => handleToggleFav(q._id, q.isFavorite)}
                  onDelete={() => handleDelete(q._id)}
                  copied={copied}
                />
              ))}
            </Section>
          )}
          {topUsage.length > 0 && (
            <Section title="🔥 Most Used">
              {topUsage.map((q) => (
                <QueryCard
                  key={q._id}
                  item={q}
                  onCopy={(fmt) => handleCopy(q._id, q.query, q.variables, fmt)}
                  onToggleFav={() => handleToggleFav(q._id, q.isFavorite)}
                  onDelete={() => handleDelete(q._id)}
                  copied={copied}
                />
              ))}
            </Section>
          )}
          {Object.entries(byProject).map(([project, items]) => (
            <Section key={project} title={`📁 ${project}`}>
              {items.map((q) => (
                <QueryCard
                  key={q._id}
                  item={q}
                  onCopy={(fmt) => handleCopy(q._id, q.query, q.variables, fmt)}
                  onToggleFav={() => handleToggleFav(q._id, q.isFavorite)}
                  onDelete={() => handleDelete(q._id)}
                  copied={copied}
                />
              ))}
            </Section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddQueryDialog
            slug={slug}
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
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function QueryCard({
  item,
  onCopy,
  onToggleFav,
  onDelete,
  copied,
}: {
  item: GqlQuery;
  onCopy: (fmt: (q: string, v: string) => string) => void;
  onToggleFav: () => void;
  onDelete: () => void;
  copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFormats, setShowFormats] = useState(false);

  const previewLines = item.query
    ? item.query.split("\n").slice(0, 3).join("\n")
    : "";

  let parsedVars: Record<string, unknown> = {};
  try {
    if (item.variables) parsedVars = JSON.parse(item.variables) as Record<string, unknown>;
  } catch {
    /* empty */
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-200">{item.name}</span>
        <span className="text-xs text-zinc-500">{item.projectName}</span>
      </div>
      {previewLines && (
        <pre className="mb-2 font-mono text-xs leading-relaxed text-zinc-500/40">
          {previewLines}
        </pre>
      )}
      {Object.keys(parsedVars).length > 0 && (
        <div className="mb-2 space-y-0.5">
          {Object.entries(parsedVars).map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="font-mono text-zinc-400">{k}:</span>
              <span className="font-mono text-zinc-500">
                {isSensitiveKey(k) ? maskValue(String(v)) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setShowFormats(!showFormats)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showFormats && (
            <div className="absolute left-0 top-8 z-20 rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
              {COPY_FORMATS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => { onCopy(f.fn); setShowFormats(false); }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
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

function AddQueryDialog({
  slug,
  onClose,
  onCreated,
}: {
  slug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [variables, setVariables] = useState("");
  const [varError, setVarError] = useState("");
  const [saving, setSaving] = useState(false);

  function validateVars() {
    if (!variables.trim()) { setVarError(""); return; }
    try {
      JSON.parse(variables);
      setVarError("");
    } catch {
      setVarError("Invalid JSON");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !query.trim() || varError) return;
    setSaving(true);
    await createQuery(slug, projectName.trim(), name.trim(), query, variables);
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
        className="fixed inset-x-0 top-[10%] z-50 mx-auto w-full max-w-lg rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Add GraphQL Query</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Project</label>
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-api"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Name</label>
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="GetUsers"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Query</label>
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
              rows={6}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="query GetUsers { ... }"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Variables (JSON)</label>
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
              rows={3}
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              onBlur={validateVars}
              placeholder='{"limit": 10}'
            />
            {varError && <p className="mt-1 text-xs text-red-400">{varError}</p>}
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim() || !query.trim() || !!varError}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save Query"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
