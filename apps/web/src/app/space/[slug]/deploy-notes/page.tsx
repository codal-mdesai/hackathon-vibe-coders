"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionPageShell } from "@/components/SectionPageShell";
import { useSpace } from "@/components/SpaceProvider";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { fetchDeployNotes } from "@/sanity/queries/deploy";
import {
  createDeployNote,
  deleteDeployNote,
  toggleDeployFavorite,
  generateReadme,
} from "@/actions/deploy-notes";
import type { DeployNote, TechArea } from "@/types/sanity";
import {
  Star,
  Copy,
  Check,
  MoreHorizontal,
  Plus,
  Trash2,
  FileDown,
  Terminal,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

export default function DeployNotesPage() {
  const { slug } = useSpace();
  const { copied, copy } = useCopyToClipboard();
  const [notes, setNotes] = useState<DeployNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchDeployNotes(slug);
    setNotes(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const allAreas = notes.flatMap((n) =>
    n.techAreas.map((a) => ({ ...a, projectName: n.projectName, docId: n._id })),
  );
  const favorites = allAreas.filter((a) => a.isFavorite);

  async function handleToggleFav(docId: string, areaId: string, current: boolean) {
    setNotes((prev) =>
      prev.map((n) =>
        n._id === docId
          ? { ...n, techAreas: n.techAreas.map((a) => (a.id === areaId ? { ...a, isFavorite: !current } : a)) }
          : n,
      ),
    );
    await toggleDeployFavorite(docId, areaId, !current);
  }

  async function handleDelete(docId: string, areaId: string) {
    setNotes((prev) =>
      prev.map((n) =>
        n._id === docId
          ? { ...n, techAreas: n.techAreas.filter((a) => a.id !== areaId) }
          : n,
      ),
    );
    await deleteDeployNote(docId, areaId);
  }

  async function handleCopyCommands(docId: string, area: TechArea) {
    const text = area.commands
      .map((c) => `${c.step}. ${c.command} — ${c.description}`)
      .join("\n");
    await copy(text);
  }

  async function handleDownloadReadme(docId: string, areaId: string) {
    const md = await generateReadme(docId, areaId);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SectionPageShell
      title="Deploy Notes"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Deploy Note
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-800/30" />
          ))}
        </div>
      ) : allAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-3 text-sm text-zinc-500">No deploy notes yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" /> Add your first note
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <Section title="⭐ Favorite Tech Areas">
              <div className="space-y-3">
                {favorites.map((a) => (
                  <AreaCard
                    key={a.id}
                    area={a}
                    projectName={a.projectName}
                    onToggleFav={() => handleToggleFav(a.docId, a.id, a.isFavorite)}
                    onDelete={() => handleDelete(a.docId, a.id)}
                    onCopyCommands={() => handleCopyCommands(a.docId, a)}
                    onDownloadReadme={() => handleDownloadReadme(a.docId, a.id)}
                    copied={copied}
                  />
                ))}
              </div>
            </Section>
          )}
          {notes.map((n) => (
            <Section key={n._id} title={`📁 ${n.projectName}`}>
              <div className="space-y-3">
                {n.techAreas.map((a) => (
                  <AreaCard
                    key={a.id}
                    area={a}
                    projectName={n.projectName}
                    onToggleFav={() => handleToggleFav(n._id, a.id, a.isFavorite)}
                    onDelete={() => handleDelete(n._id, a.id)}
                    onCopyCommands={() => handleCopyCommands(n._id, a)}
                    onDownloadReadme={() => handleDownloadReadme(n._id, a.id)}
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
          <AddDeployDialog
            slug={slug}
            notes={notes}
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

function AreaCard({
  area,
  projectName,
  onToggleFav,
  onDelete,
  onCopyCommands,
  onDownloadReadme,
  copied,
}: {
  area: TechArea;
  projectName: string;
  onToggleFav: () => void;
  onDelete: () => void;
  onCopyCommands: () => void;
  onDownloadReadme: () => void;
  copied: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-lg border border-zinc-800 bg-[var(--bg-card)] p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-1 text-xs text-zinc-500">{projectName}</div>
      <div className="mb-3 text-sm font-semibold text-zinc-200">{area.name}</div>
      <div className="space-y-1">
        {area.commands.map((c) => (
          <div key={c.step} className="flex items-start gap-2 font-mono text-xs">
            <span className="shrink-0 text-zinc-500">{c.step}.</span>
            <span className="text-zinc-300">{c.command}</span>
            {c.description && (
              <span className="text-zinc-600">— {c.description}</span>
            )}
          </div>
        ))}
      </div>
      {area.notes && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Notes
          </button>
          {expanded && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{area.notes}</p>
          )}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={onCopyCommands}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Terminal className="h-3.5 w-3.5" />}
          Get Commands
        </button>
        <button
          onClick={onDownloadReadme}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <FileDown className="h-3.5 w-3.5" /> Get README
        </button>
        <button
          onClick={onToggleFav}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-yellow-400"
        >
          <Star className={`h-3.5 w-3.5 ${area.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
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

function AddDeployDialog({
  slug,
  notes,
  onClose,
  onCreated,
}: {
  slug: string;
  notes: DeployNote[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const [areaName, setAreaName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [commands, setCommands] = useState([{ step: 1, command: "", description: "" }]);
  const [saving, setSaving] = useState(false);

  const existingProjects = [...new Set(notes.map((n) => n.projectName))];

  function addCommand() {
    setCommands((prev) => [...prev, { step: prev.length + 1, command: "", description: "" }]);
  }

  function updateCommand(idx: number, field: "command" | "description", value: string) {
    setCommands((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim() || !areaName.trim()) return;
    setSaving(true);
    await createDeployNote(slug, projectName.trim(), {
      name: areaName.trim(),
      notes: noteText,
      commands: commands.filter((c) => c.command.trim()),
    });
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
          <h2 className="text-lg font-semibold text-zinc-100">Add Deploy Note</h2>
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
                list="deploy-projects"
                placeholder="my-app"
              />
              <datalist id="deploy-projects">
                {existingProjects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Tech Area</label>
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. Docker, AWS, CI/CD"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Commands</label>
            <div className="space-y-2">
              {commands.map((c, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2">
                  <span className="flex items-center justify-center text-xs text-zinc-500">{c.step}</span>
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    value={c.command}
                    onChange={(e) => updateCommand(i, "command", e.target.value)}
                    placeholder="npm run build"
                  />
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    value={c.description}
                    onChange={(e) => updateCommand(i, "description", e.target.value)}
                    placeholder="Build production"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCommand}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              + Add command
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Notes (optional)</label>
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Additional context..."
            />
          </div>
          <button
            type="submit"
            disabled={saving || !projectName.trim() || !areaName.trim()}
            className="w-full rounded-md py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save Deploy Note"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
