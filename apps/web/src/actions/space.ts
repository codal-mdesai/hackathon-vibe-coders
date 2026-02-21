"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { client } from "@/sanity/lib/client";

export async function createSpace(slug: string, displayName: string, accentColor: string) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "space" && slug == $slug][0]{_id}`,
    { slug } as Record<string, unknown>,
  );

  if (existing) return existing._id;

  const doc = await writeClient.create({
    _type: "space",
    slug,
    displayName,
    accentColor,
    createdAt: new Date().toISOString(),
  });

  return doc._id;
}

export async function updateSpaceName(slug: string, displayName: string) {
  const space = await client.fetch<{ _id: string } | null>(
    `*[_type == "space" && slug == $slug][0]{_id}`,
    { slug } as Record<string, unknown>,
  );

  if (!space) return;

  await writeClient.patch(space._id).set({ displayName }).commit();
}

export async function updateSpaceAccent(slug: string, accentColor: string) {
  const space = await client.fetch<{ _id: string } | null>(
    `*[_type == "space" && slug == $slug][0]{_id}`,
    { slug } as Record<string, unknown>,
  );

  if (!space) return;

  await writeClient.patch(space._id).set({ accentColor }).commit();
}
