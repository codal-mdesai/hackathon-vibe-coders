"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { isSensitiveKey, maskValue } from "@/lib/mask";
import { fetchJsonPayloads, fetchCurlCommands } from "@/sanity/queries/payloads";
import {
  createJsonPayload,
  deleteJsonPayload,
  createCurlCommand,
  deleteCurlCommand,
  togglePayloadFavorite,
  updatePayloadLastUsed,
  sharePayload,
} from "@/actions/payloads";
import type { JsonPayload, CurlCommand } from "@/types/sanity";
import {
  Star,
  Copy,
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  Share2,
  X,
} from "lucide-react";

type Tab = "json" | "curl";

export default function PayloadsPage() {
  const { slug } = useSpace();
  const [activeTab, setActiveTab] = useState<Tab>("json");
  const [jsonPayloads, setJsonPayloads] = useState<JsonPayload[]>([]);
  const [curlCommands, setCurlCommands] = useState<CurlCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddJson, setShowAddJson] = useState(false);
  const [showAddCurl, setShowAddCurl] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const load = useCallback(async () => {
    const [jp, cc] = await Promise.all([
      fetchJsonPayloads(slug),
      fetchCurlCommands(slug),
    ]);
    setJsonPayloads(jp);
    setCurlCommands(cc);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function handleCopy(id: string, text: string) {
    await copy(text);
    updatePayloadLastUsed(id).catch(() => {});
  }

  return (
    <SectionPageShell
      title="Payloads"
      actions={
        <button
          onClick={() => activeTab === "json" ? setShowAddJson(true) : setShowAddCurl(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> {activeTab === "json" ? "Add JSON" : "Add CURL"}
        </button>
      }
    >
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
        <button
          onClick={() => setActiveTab("json")}
          className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
            activeTab === "json" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          JSON Payloads
        </button>
        <button
          onClick={() => setActiveTab("curl")}
          className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
            activeTab === "curl" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          CURL Commands
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : activeTab === "json" ? (
        <JsonSection
          payloads={jsonPayloads}
          setPayloads={setJsonPayloads}
          onCopy={handleCopy}
          copied={copied}
          onShowAdd={() => setShowAddJson(true)}
          copy={copy}
        />
      ) : (
        <CurlSection
          commands={curlCommands}
          setCommands={setCurlCommands}
          onCopy={handleCopy}
          copied={copied}
          onShowAdd={() => setShowAddCurl(true)}
          copy={copy}
        />
      )}

      <AnimatePresence>
        {showAddJson && (
          <AddJsonDialog slug={slug} onClose={() => setShowAddJson(false)} onCreated={load} />
        )}
        {showAddCurl && (
          <AddCurlDialog slug={slug} onClose={() => setShowAddCurl(false)} onCreated={load} />
        )}
      </AnimatePresence>
    </SectionPageShell>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 text-sm font-medium text-zinc-400">{title}</h2>;
}

function JsonSection({
  payloads,
  setPayloads,
  onCopy,
  copied,
  onShowAdd,
  copy,
}: {
  payloads: JsonPayload[];
  setPayloads: React.Dispatch<React.SetStateAction<JsonPayload[]>>;
  onCopy: (id: string, text: string) => void;
  copied: boolean;
  onShowAdd: () => void;
  copy: (text: string) => Promise<void>;
}) {
  const favorites = payloads.filter((p) => p.isFavorite);
  const recent = [...payloads]
    .filter((p) => p.lastUsed)
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 5);
  const byProject = payloads.reduce<Record<string, JsonPayload[]>>((acc, p) => {
    const key = p.projectName || "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(p);
    return acc;
  }, {});

  if (payloads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-3 text-sm text-zinc-500">No JSON payloads yet</p>
        <button onClick={onShowAdd} className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">
          <Plus className="h-4 w-4" /> Add first payload
        </button>
      </div>
    );
  }

  async function handleToggleFav(id: string, current: boolean) {
    setPayloads((prev) => prev.map((p) => (p._id === id ? { ...p, isFavorite: !current } : p)));
    await togglePayloadFavorite(id, "jsonPayload", !current);
  }

  async function handleDelete(id: string) {
    setPayloads((prev) => prev.filter((p) => p._id !== id));
    await deleteJsonPayload(id);
  }

  async function handleShare(id: string) {
    const token = await sharePayload("jsonPayload", id, 24);
    const url = `${window.location.origin}/share/${token}`;
    await copy(url);
  }

  return (
    <div className="space-y-6">
      {favorites.length > 0 && (
        <div>
          <SectionHeader title="⭐ Favorites" />
          <div className="space-y-3">
            {favorites.map((p) => (
              <JsonCard key={p._id} item={p} onCopy={() => onCopy(p._id, p.payload)} onToggleFav={() => handleToggleFav(p._id, p.isFavorite)} onDelete={() => handleDelete(p._id)} onShare={() => handleShare(p._id)} copied={copied} />
            ))}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div>
          <SectionHeader title="🕐 Recently Used" />
          <div className="space-y-3">
            {recent.map((p) => (
              <JsonCard key={p._id} item={p} onCopy={() => onCopy(p._id, p.payload)} onToggleFav={() => handleToggleFav(p._id, p.isFavorite)} onDelete={() => handleDelete(p._id)} onShare={() => handleShare(p._id)} copied={copied} />
            ))}
          </div>
        </div>
      )}
      {Object.entries(byProject).map(([project, items]) => (
        <div key={project}>
          <SectionHeader title={`📁 ${project}`} />
          <div className="space-y-3">
            {items.map((p) => (
              <JsonCard key={p._id} item={p} onCopy={() => onCopy(p._id, p.payload)} onToggleFav={() => handleToggleFav(p._id, p.isFavorite)} onDelete={() => handleDelete(p._id)} onShare={() => handleShare(p._id)} copied={copied} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JsonCard({
  item, onCopy, onToggleFav, onDelete, onShare, copied,
}: {
  item: JsonPayload; onCopy: () => void; onToggleFav: () => void; onDelete: () => void; onShare: () => void; copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const preview = item.payload ? item.payload.split("\n").slice(0, 3).join("\n") : "";

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-200">{item.name}</span>
        <span className="text-xs text-zinc-500">{item.projectName}</span>
      </div>
      {preview && <pre className="mb-2 font-mono text-xs text-zinc-500">{preview}</pre>}
      <div className="mt-3 flex items-center gap-1">
        <button onClick={onCopy} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />} Copy
        </button>
        <button onClick={onShare} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button onClick={onToggleFav} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-yellow-400">
          <Star className={`h-3.5 w-3.5 ${item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
        <button onClick={() => setShowMenu(!showMenu)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-3 top-12 z-20 rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
            <button onClick={() => { onDelete(); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-800">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CurlSection({
  commands, setCommands, onCopy, copied, onShowAdd, copy,
}: {
  commands: CurlCommand[]; setCommands: React.Dispatch<React.SetStateAction<CurlCommand[]>>; onCopy: (id: string, text: string) => void; copied: boolean; onShowAdd: () => void; copy: (text: string) => Promise<void>;
}) {
  const favorites = commands.filter((c) => c.isFavorite);
  const recent = [...commands].filter((c) => c.lastUsed).sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()).slice(0, 5);
  const byCategory = commands.reduce<Record<string, CurlCommand[]>>((acc, c) => {
    const key = c.category || "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(c);
    return acc;
  }, {});

  if (commands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-3 text-sm text-zinc-500">No CURL commands yet</p>
        <button onClick={onShowAdd} className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">
          <Plus className="h-4 w-4" /> Add first command
        </button>
      </div>
    );
  }

  async function handleToggleFav(id: string, current: boolean) {
    setCommands((prev) => prev.map((c) => (c._id === id ? { ...c, isFavorite: !current } : c)));
    await togglePayloadFavorite(id, "curlCommand", !current);
  }

  async function handleDelete(id: string) {
    setCommands((prev) => prev.filter((c) => c._id !== id));
    await deleteCurlCommand(id);
  }

  async function handleShare(id: string) {
    const token = await sharePayload("curlCommand", id, 24);
    const url = `${window.location.origin}/share/${token}`;
    await copy(url);
  }

  return (
    <div className="space-y-6">
      {favorites.length > 0 && (
        <div>
          <SectionHeader title="⭐ Favorites" />
          <div className="space-y-3">
            {favorites.map((c) => (
              <CurlCard key={c._id} item={c} onCopy={() => onCopy(c._id, c.command)} onToggleFav={() => handleToggleFav(c._id, c.isFavorite)} onDelete={() => handleDelete(c._id)} onShare={() => handleShare(c._id)} copied={copied} />
            ))}
          </div>
        </div>
      )}
      {recent.length > 0 && (
        <div>
          <SectionHeader title="🕐 Recently Used" />
          <div className="space-y-3">
            {recent.map((c) => (
              <CurlCard key={c._id} item={c} onCopy={() => onCopy(c._id, c.command)} onToggleFav={() => handleToggleFav(c._id, c.isFavorite)} onDelete={() => handleDelete(c._id)} onShare={() => handleShare(c._id)} copied={copied} />
            ))}
          </div>
        </div>
      )}
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <SectionHeader title={`📁 ${cat}`} />
          <div className="space-y-3">
            {items.map((c) => (
              <CurlCard key={c._id} item={c} onCopy={() => onCopy(c._id, c.command)} onToggleFav={() => handleToggleFav(c._id, c.isFavorite)} onDelete={() => handleDelete(c._id)} onShare={() => handleShare(c._id)} copied={copied} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CurlCard({
  item, onCopy, onToggleFav, onDelete, onShare, copied,
}: {
  item: CurlCommand; onCopy: () => void; onToggleFav: () => void; onDelete: () => void; onShare: () => void; copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-200">{item.label}</span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{item.category}</span>
      </div>
      <pre className="mb-2 whitespace-pre-wrap font-mono text-xs text-zinc-400">{item.command}</pre>
      <div className="mt-3 flex items-center gap-1">
        <button onClick={onCopy} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />} Copy
        </button>
        <button onClick={onShare} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button onClick={onToggleFav} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-yellow-400">
          <Star className={`h-3.5 w-3.5 ${item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
        <button onClick={() => setShowMenu(!showMenu)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-3 top-12 z-20 rounded-md border border-zinc-800 bg-zinc-900 py-1 shadow-lg">
            <button onClick={() => { onDelete(); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-800">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddJsonDialog({ slug, onClose, onCreated }: { slug: string; onClose: () => void; onCreated: () => void }) {
  const [projectName, setProjectName] = useState("");
  const [name, setName] = useState("");
  const [payload, setPayload] = useState("");
  const [payloadError, setPayloadError] = useState("");
  const [saving, setSaving] = useState(false);

  function validatePayload() {
    if (!payload.trim()) { setPayloadError(""); return; }
    try { JSON.parse(payload); setPayloadError(""); } catch { setPayloadError("Invalid JSON"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || payloadError) return;
    setSaving(true);
    await createJsonPayload(slug, projectName.trim(), name.trim(), payload);
    onCreated(); onClose();
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-md rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Add JSON Payload</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Project</label>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="my-api" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Name</label>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500" value={name} onChange={(e) => setName(e.target.value)} placeholder="Create User" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Payload</label>
            <textarea className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500" rows={6} value={payload} onChange={(e) => setPayload(e.target.value)} onBlur={validatePayload} placeholder='{"key": "value"}' />
            {payloadError && <p className="mt-1 text-xs text-red-400">{payloadError}</p>}
          </div>
          <button type="submit" disabled={saving || !name.trim() || !!payloadError} className="w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "var(--accent)" }}>{saving ? "Saving…" : "Save Payload"}</button>
        </form>
      </motion.div>
    </>
  );
}

function AddCurlDialog({ slug, onClose, onCreated }: { slug: string; onClose: () => void; onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [command, setCommand] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !command.trim()) return;
    setSaving(true);
    await createCurlCommand(slug, label.trim(), command, category.trim());
    onCreated(); onClose();
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-md rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Add CURL Command</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Label</label>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Create User" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Category</label>
              <input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="API, Auth, Deploy" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Command</label>
            <textarea className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500" rows={4} value={command} onChange={(e) => setCommand(e.target.value)} placeholder="curl -X POST ..." />
          </div>
          <button type="submit" disabled={saving || !label.trim() || !command.trim()} className="w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "var(--accent)" }}>{saving ? "Saving…" : "Save Command"}</button>
        </form>
      </motion.div>
    </>
  );
}
