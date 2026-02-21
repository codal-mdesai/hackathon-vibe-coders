"use server";

import { writeClient } from "@/sanity/lib/write-client";

export async function createPin(
  spaceSlug: string,
  url: string,
  title: string,
  tags: string[],
  addedBy: string,
  color: string,
) {
  const doc = await writeClient.create({
    _type: "pin",
    spaceSlug,
    url,
    title,
    tags,
    addedBy,
    color,
    createdAt: new Date().toISOString(),
  });
  return doc._id;
}

export async function deletePin(id: string) {
  await writeClient.delete(id);
}

export async function fetchPageTitle(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}
