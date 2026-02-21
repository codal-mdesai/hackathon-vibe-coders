"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { nanoid } from "nanoid";
import { generateShareLink } from "@/lib/share";

export async function createWebhook(
  spaceSlug: string,
  projectName: string,
  name: string,
  url: string,
  headers: Array<{ key: string; value: string }>,
  payload: string,
  comments: Array<{ field: string; comment: string }>,
) {
  const doc = await writeClient.create({
    _type: "webhook",
    spaceSlug,
    projectName,
    name,
    url,
    headers: headers.map((h) => ({ ...h, _key: nanoid(12) })),
    payload,
    comments: comments.map((c) => ({ ...c, _key: nanoid(12) })),
    isFavorite: false,
    lastUsed: new Date().toISOString(),
  });
  return doc._id;
}

export async function updateWebhook(
  id: string,
  updates: {
    name?: string;
    url?: string;
    headers?: Array<{ key: string; value: string }>;
    payload?: string;
    comments?: Array<{ field: string; comment: string }>;
  },
) {
  const patch = writeClient.patch(id);
  if (updates.name) patch.set({ name: updates.name });
  if (updates.url) patch.set({ url: updates.url });
  if (updates.headers) patch.set({ headers: updates.headers.map((h) => ({ ...h, _key: nanoid(12) })) });
  if (updates.payload !== undefined) patch.set({ payload: updates.payload });
  if (updates.comments) patch.set({ comments: updates.comments.map((c) => ({ ...c, _key: nanoid(12) })) });
  await patch.commit();
}

export async function deleteWebhook(id: string) {
  await writeClient.delete(id);
}

export async function toggleWebhookFavorite(id: string, isFavorite: boolean) {
  await writeClient.patch(id).set({ isFavorite }).commit();
}

export async function updateWebhookLastUsed(id: string) {
  await writeClient.patch(id).set({ lastUsed: new Date().toISOString() }).commit();
}

export async function shareWebhook(id: string, hours: number) {
  return generateShareLink("webhook", id, hours);
}
