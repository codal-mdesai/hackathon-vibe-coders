"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { client } from "@/sanity/lib/client";
import { nanoid } from "nanoid";
import type { TechArea } from "@/types/sanity";

export async function createDeployNote(
  spaceSlug: string,
  projectName: string,
  techArea: Omit<TechArea, "id" | "isFavorite">,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "deployNote" && spaceSlug == $spaceSlug && projectName == $projectName][0]{_id}`,
    { spaceSlug, projectName } as Record<string, unknown>,
  );

  const area = {
    _key: nanoid(12),
    id: nanoid(12),
    name: techArea.name,
    isFavorite: false,
    notes: techArea.notes,
    commands: techArea.commands.map((c) => ({ ...c, _key: nanoid(12) })),
  };

  if (existing) {
    await writeClient
      .patch(existing._id)
      .setIfMissing({ techAreas: [] })
      .append("techAreas", [area])
      .commit();
    return existing._id;
  }

  const doc = await writeClient.create({
    _type: "deployNote",
    spaceSlug,
    projectName,
    techAreas: [area],
  });
  return doc._id;
}

export async function updateDeployNote(
  docId: string,
  areaId: string,
  updates: { name?: string; notes?: string; commands?: Array<{ step: number; command: string; description: string }> },
) {
  const doc = await client.fetch<{ techAreas: Array<{ id: string; _key: string }> }>(
    `*[_type == "deployNote" && _id == $docId][0]{techAreas[]{id, _key}}`,
    { docId } as Record<string, unknown>,
  );
  if (!doc) return;
  const area = doc.techAreas.find((a) => a.id === areaId);
  if (!area) return;

  const patch = writeClient.patch(docId);
  if (updates.name) patch.set({ [`techAreas[_key=="${area._key}"].name`]: updates.name });
  if (updates.notes !== undefined) patch.set({ [`techAreas[_key=="${area._key}"].notes`]: updates.notes });
  if (updates.commands) {
    patch.set({
      [`techAreas[_key=="${area._key}"].commands`]: updates.commands.map((c) => ({ ...c, _key: nanoid(12) })),
    });
  }
  await patch.commit();
}

export async function deleteDeployNote(docId: string, areaId: string) {
  const doc = await client.fetch<{ techAreas: Array<{ id: string; _key: string }> }>(
    `*[_type == "deployNote" && _id == $docId][0]{techAreas[]{id, _key}}`,
    { docId } as Record<string, unknown>,
  );
  if (!doc) return;
  const area = doc.techAreas.find((a) => a.id === areaId);
  if (!area) return;

  await writeClient
    .patch(docId)
    .unset([`techAreas[_key=="${area._key}"]`])
    .commit();
}

export async function toggleDeployFavorite(docId: string, areaId: string, isFavorite: boolean) {
  const doc = await client.fetch<{ techAreas: Array<{ id: string; _key: string }> }>(
    `*[_type == "deployNote" && _id == $docId][0]{techAreas[]{id, _key}}`,
    { docId } as Record<string, unknown>,
  );
  if (!doc) return;
  const area = doc.techAreas.find((a) => a.id === areaId);
  if (!area) return;

  await writeClient
    .patch(docId)
    .set({ [`techAreas[_key=="${area._key}"].isFavorite`]: isFavorite })
    .commit();
}

export async function generateReadme(docId: string, areaId: string): Promise<string> {
  const doc = await client.fetch<{
    projectName: string;
    techAreas: Array<{ id: string; name: string; notes: string; commands: Array<{ step: number; command: string; description: string }> }>;
  }>(
    `*[_type == "deployNote" && _id == $docId][0]{projectName, techAreas[]{id, name, notes, commands[]{step, command, description}}}`,
    { docId } as Record<string, unknown>,
  );
  if (!doc) return "";
  const area = doc.techAreas.find((a) => a.id === areaId);
  if (!area) return "";

  const lines = [
    `# ${doc.projectName} — ${area.name}`,
    "",
    "## Commands",
    "",
    ...area.commands.map((c) => `${c.step}. \`${c.command}\` — ${c.description}`),
  ];
  if (area.notes) {
    lines.push("", "## Notes", "", area.notes);
  }
  return lines.join("\n");
}
