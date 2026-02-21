"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { isSensitiveKey, maskValue } from "@/lib/mask";
import { fetchWebhooks } from "@/sanity/queries/webhooks";
import {
  createWebhook,
  deleteWebhook,
  toggleWebhookFavorite,
  updateWebhookLastUsed,
  shareWebhook,
} from "@/actions/webhooks";
import type { WebhookDoc } from "@/types/sanity";
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

export default function WebhooksPage() {
  const { slug } = useSpace();
  const { copied, copy } = useCopyToClipboard();
  const [webhooks, setWebhooks] = useState<WebhookDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [shareDialog, setShareDialog] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchWebhooks(slug);
    setWebhooks(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const favorites = webhooks.filter((w) => w.isFavorite);
  const recentlyUsed = [...webhooks]
    .filter((w) => w.lastUsed)
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 5);
  const byProject = webhooks.reduce<Record<string, WebhookDoc[]>>((acc, w) => {
    const key = w.projectName || "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(w);
    return acc;
  }, {});

  async function handleCopyPayload(id: string, payload: string) {
    await copy(payload);
    updateWebhookLastUsed(id).catch(() => {});
  }

  async function handleToggleFav(id: string, current: boolean) {
    setWebhooks((prev) =>
      prev.map((w) => (w._id === id ? { ...w, isFavorite: !current } : w)),
    );
    await toggleWebhookFavorite(id, !current);
  }

  async function handleDelete(id: string) {
    setWebhooks((prev) => prev.filter((w) => w._id !== id));
    await deleteWebhook(id);
  }

  return (
    <SectionPageShell
      title="Webhooks"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Webhook
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No webhooks saved yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add your first webhook
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <Section title="⭐ Favorites">
              {favorites.map((w) => (
                <WebhookCard
                  key={w._id}
                  item={w}
                  onCopyPayload={() => handleCopyPayload(w._id, w.payload)}
                  onToggleFav={() => handleToggleFav(w._id, w.isFavorite)}
                  onDelete={() => handleDelete(w._id)}
                  onShare={() => setShareDialog(w._id)}
                  copied={copied}
                />
              ))}
            </Section>
          )}
          {recentlyUsed.length > 0 && (
            <Section title="🕐 Recently Used">
              {recentlyUsed.map((w) => (
                <WebhookCard
                  key={w._id}
                  item={w}
                  onCopyPayload={() => handleCopyPayload(w._id, w.payload)}
                  onToggleFav={() => handleToggleFav(w._id, w.isFavorite)}
                  onDelete={() => handleDelete(w._id)}
                  onShare={() => setShareDialog(w._id)}
                  copied={copied}
                />
              ))}
            </Section>
          )}
          {Object.entries(byProject).map(([project, items]) => (
            <Section key={project} title={`📁 ${project}`}>
              {items.map((w) => (
                <WebhookCard
                  key={w._id}
                  item={w}
                  onCopyPayload={() => handleCopyPayload(w._id, w.payload)}
                  onToggleFav={() => handleToggleFav(w._id, w.isFavorite)}
                  onDelete={() => handleDelete(w._id)}
                  onShare={() => setShareDialog(w._id)}
                  copied={copied}
                />
              ))}
            </Section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddWebhookDialog
            slug={slug}
            onClose={() => setShowAdd(false)}
            onCreated={load}
          />
        )}
        {shareDialog && (
          <ShareDialog
            webhookId={shareDialog}
            onClose={() => setShareDialog(null)}
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

function WebhookCard({
  item,
  onCopyPayload,
  onToggleFav,
  onDelete,
  onShare,
  copied,
}: {
  item: WebhookDoc;
  onCopyPayload: () => void;
  onToggleFav: () => void;
  onDelete: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-200">{item.name}</span>
      </div>
      <div className="mb-2 font-mono text-xs text-zinc-400">{item.url}</div>
      {item.headers && item.headers.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {item.headers.map((h, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="font-mono text-zinc-400">{h.key}:</span>
              <span className="font-mono text-zinc-500">
                {isSensitiveKey(h.key) ? maskValue(h.value) : h.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {item.payload && (
        <pre className="mb-2 max-h-24 overflow-hidden font-mono text-xs text-zinc-500">
          {item.payload.slice(0, 200)}
        </pre>
      )}
      {item.comments && item.comments.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {item.comments.map((c, i) => (
            <div key={i} className="text-xs text-zinc-500">
              <span className="font-mono text-zinc-400">{c.field}</span>: {c.comment}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={onCopyPayload}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          Copy Payload
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
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

function ShareDialog({ webhookId, onClose }: { webhookId: string; onClose: () => void }) {
  const [hours, setHours] = useState(24);
  const [shareUrl, setShareUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  async function handleGenerate() {
    setGenerating(true);
    const token = await shareWebhook(webhookId, hours);
    const url = `${window.location.origin}/share/${token}`;
    setShareUrl(url);
    await copy(url);
    setGenerating(false);
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
        className="fixed inset-x-0 top-[25%] z-50 mx-auto w-full max-w-sm rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Share Link</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        {!shareUrl ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Valid for how many hours?</label>
              <input
                type="number"
                min={1}
                max={720}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {generating ? "Generating…" : "Generate Link"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-zinc-900 p-3 font-mono text-xs text-zinc-300 break-all">
              {shareUrl}
            </div>
            <p className="text-xs text-zinc-500">
              {copied ? "Copied to clipboard!" : `Expires in ${hours} hours`}
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}

function AddWebhookDialog({
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
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [payload, setPayload] = useState("");
  const [comments, setComments] = useState([{ field: "", comment: "" }]);
  const [payloadError, setPayloadError] = useState("");
  const [saving, setSaving] = useState(false);

  function validatePayload() {
    if (!payload.trim()) { setPayloadError(""); return; }
    try {
      JSON.parse(payload);
      setPayloadError("");
    } catch {
      setPayloadError("Invalid JSON");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim() || payloadError) return;
    setSaving(true);
    await createWebhook(
      slug,
      projectName.trim(),
      name.trim(),
      url.trim(),
      headers.filter((h) => h.key.trim()),
      payload,
      comments.filter((c) => c.field.trim()),
    );
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
        className="fixed inset-x-0 top-[5%] z-50 mx-auto w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-zinc-800 bg-[var(--bg-card)] p-6 shadow-2xl scrollbar-thin"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Add Webhook</h2>
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
                placeholder="Stripe Events"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">URL</label>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Headers</label>
            {headers.map((h, i) => (
              <div key={i} className="mb-1 grid grid-cols-2 gap-2">
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                  value={h.key}
                  onChange={(e) => setHeaders((prev) => prev.map((p, j) => (j === i ? { ...p, key: e.target.value } : p)))}
                  placeholder="Content-Type"
                />
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                  value={h.value}
                  onChange={(e) => setHeaders((prev) => prev.map((p, j) => (j === i ? { ...p, value: e.target.value } : p)))}
                  placeholder="application/json"
                />
              </div>
            ))}
            <button type="button" onClick={() => setHeaders([...headers, { key: "", value: "" }])} className="text-xs text-zinc-500 hover:text-zinc-300">+ Add header</button>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Payload (JSON)</label>
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              onBlur={validatePayload}
              placeholder='{"event": "..."}'
            />
            {payloadError && <p className="mt-1 text-xs text-red-400">{payloadError}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Field Comments</label>
            {comments.map((c, i) => (
              <div key={i} className="mb-1 grid grid-cols-2 gap-2">
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                  value={c.field}
                  onChange={(e) => setComments((prev) => prev.map((p, j) => (j === i ? { ...p, field: e.target.value } : p)))}
                  placeholder="event"
                />
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                  value={c.comment}
                  onChange={(e) => setComments((prev) => prev.map((p, j) => (j === i ? { ...p, comment: e.target.value } : p)))}
                  placeholder="Event type identifier"
                />
              </div>
            ))}
            <button type="button" onClick={() => setComments([...comments, { field: "", comment: "" }])} className="text-xs text-zinc-500 hover:text-zinc-300">+ Add comment</button>
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim() || !url.trim() || !!payloadError}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save Webhook"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
