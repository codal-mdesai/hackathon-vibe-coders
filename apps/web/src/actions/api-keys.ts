"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { client } from "@/sanity/lib/client";
import { nanoid } from "nanoid";

export async function createApiKey(
  spaceSlug: string,
  storeName: string,
  label: string,
  encryptedValue: string,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug && storeName == $storeName][0]{_id}`,
    { spaceSlug, storeName } as Record<string, unknown>,
  );

  const keyItem = {
    _key: nanoid(12),
    id: nanoid(12),
    label,
    encryptedValue,
    isFavorite: false,
    usageCount: 0,
    lastUsed: new Date().toISOString(),
  };

  if (existing) {
    await writeClient
      .patch(existing._id)
      .setIfMissing({ keys: [] })
      .append("keys", [keyItem])
      .commit();
    return existing._id;
  }

  const doc = await writeClient.create({
    _type: "apiKeyGroup",
    spaceSlug,
    storeName,
    keys: [keyItem],
  });
  return doc._id;
}

export async function updateApiKey(
  groupId: string,
  keyId: string,
  updates: { label?: string; encryptedValue?: string },
) {
  const group = await client.fetch<{ keys: Array<{ id: string; _key: string }> }>(
    `*[_type == "apiKeyGroup" && _id == $groupId][0]{keys[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const key = group.keys.find((k) => k.id === keyId);
  if (!key) return;

  const patch = writeClient.patch(groupId);
  if (updates.label) {
    patch.set({ [`keys[_key=="${key._key}"].label`]: updates.label });
  }
  if (updates.encryptedValue) {
    patch.set({ [`keys[_key=="${key._key}"].encryptedValue`]: updates.encryptedValue });
  }
  await patch.commit();
}

export async function deleteApiKey(groupId: string, keyId: string) {
  const group = await client.fetch<{ keys: Array<{ id: string; _key: string }> }>(
    `*[_type == "apiKeyGroup" && _id == $groupId][0]{keys[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const key = group.keys.find((k) => k.id === keyId);
  if (!key) return;

  await writeClient
    .patch(groupId)
    .unset([`keys[_key=="${key._key}"]`])
    .commit();
}

export async function toggleFavorite(groupId: string, keyId: string, isFavorite: boolean) {
  const group = await client.fetch<{ keys: Array<{ id: string; _key: string }> }>(
    `*[_type == "apiKeyGroup" && _id == $groupId][0]{keys[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const key = group.keys.find((k) => k.id === keyId);
  if (!key) return;

  await writeClient
    .patch(groupId)
    .set({ [`keys[_key=="${key._key}"].isFavorite`]: isFavorite })
    .commit();
}

export async function incrementUsage(groupId: string, keyId: string) {
  const group = await client.fetch<{ keys: Array<{ id: string; _key: string; usageCount: number }> }>(
    `*[_type == "apiKeyGroup" && _id == $groupId][0]{keys[]{id, _key, usageCount}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const key = group.keys.find((k) => k.id === keyId);
  if (!key) return;

  await writeClient
    .patch(groupId)
    .set({
      [`keys[_key=="${key._key}"].usageCount`]: (key.usageCount ?? 0) + 1,
      [`keys[_key=="${key._key}"].lastUsed`]: new Date().toISOString(),
    })
    .commit();
}
