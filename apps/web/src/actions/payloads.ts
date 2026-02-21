"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { generateShareLink } from "@/lib/share";

export async function createJsonPayload(
  spaceSlug: string,
  projectName: string,
  name: string,
  payload: string,
) {
  const doc = await writeClient.create({
    _type: "jsonPayload",
    spaceSlug,
    projectName,
    name,
    payload,
    isFavorite: false,
    lastUsed: new Date().toISOString(),
  });
  return doc._id;
}

export async function updateJsonPayload(
  id: string,
  updates: { name?: string; payload?: string; projectName?: string },
) {
  const patch = writeClient.patch(id);
  if (updates.name) patch.set({ name: updates.name });
  if (updates.payload !== undefined) patch.set({ payload: updates.payload });
  if (updates.projectName) patch.set({ projectName: updates.projectName });
  await patch.commit();
}

export async function deleteJsonPayload(id: string) {
  await writeClient.delete(id);
}

export async function createCurlCommand(
  spaceSlug: string,
  label: string,
  command: string,
  category: string,
) {
  const doc = await writeClient.create({
    _type: "curlCommand",
    spaceSlug,
    label,
    command,
    category,
    isFavorite: false,
    lastUsed: new Date().toISOString(),
  });
  return doc._id;
}

export async function updateCurlCommand(
  id: string,
  updates: { label?: string; command?: string; category?: string },
) {
  const patch = writeClient.patch(id);
  if (updates.label) patch.set({ label: updates.label });
  if (updates.command !== undefined) patch.set({ command: updates.command });
  if (updates.category) patch.set({ category: updates.category });
  await patch.commit();
}

export async function deleteCurlCommand(id: string) {
  await writeClient.delete(id);
}

export async function togglePayloadFavorite(id: string, type: "jsonPayload" | "curlCommand", isFavorite: boolean) {
  await writeClient.patch(id).set({ isFavorite }).commit();
}

export async function updatePayloadLastUsed(id: string) {
  await writeClient.patch(id).set({ lastUsed: new Date().toISOString() }).commit();
}

export async function sharePayload(resourceType: string, id: string, hours: number) {
  return generateShareLink(resourceType, id, hours);
}
