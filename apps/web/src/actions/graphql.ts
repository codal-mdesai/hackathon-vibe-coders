"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { client } from "@/sanity/lib/client";

export async function createQuery(
  spaceSlug: string,
  projectName: string,
  name: string,
  query: string,
  variables: string,
) {
  const doc = await writeClient.create({
    _type: "gqlQuery",
    spaceSlug,
    projectName,
    name,
    query,
    variables,
    isFavorite: false,
    usageCount: 0,
    lastUsed: new Date().toISOString(),
  });
  return doc._id;
}

export async function updateQuery(
  id: string,
  updates: { name?: string; query?: string; variables?: string; projectName?: string },
) {
  const patch = writeClient.patch(id);
  if (updates.name) patch.set({ name: updates.name });
  if (updates.query) patch.set({ query: updates.query });
  if (updates.variables !== undefined) patch.set({ variables: updates.variables });
  if (updates.projectName) patch.set({ projectName: updates.projectName });
  await patch.commit();
}

export async function deleteQuery(id: string) {
  await writeClient.delete(id);
}

export async function toggleQueryFavorite(id: string, isFavorite: boolean) {
  await writeClient.patch(id).set({ isFavorite }).commit();
}

export async function incrementQueryUsage(id: string) {
  const doc = await client.fetch<{ usageCount: number } | null>(
    `*[_type == "gqlQuery" && _id == $id][0]{usageCount}`,
    { id } as Record<string, unknown>,
  );
  await writeClient
    .patch(id)
    .set({
      usageCount: (doc?.usageCount ?? 0) + 1,
      lastUsed: new Date().toISOString(),
    })
    .commit();
}
