"use server";

import { writeClient } from "@/sanity/lib/write-client";
import { client } from "@/sanity/lib/client";
import { nanoid } from "nanoid";

export async function createEnvVar(
  spaceSlug: string,
  projectName: string,
  key: string,
  encryptedValue: string,
) {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "envGroup" && spaceSlug == $spaceSlug && projectName == $projectName][0]{_id}`,
    { spaceSlug, projectName } as Record<string, unknown>,
  );

  const varItem = {
    _key: nanoid(12),
    id: nanoid(12),
    key,
    encryptedValue,
    isFavorite: false,
    usageCount: 0,
    lastUsed: new Date().toISOString(),
  };

  if (existing) {
    await writeClient
      .patch(existing._id)
      .setIfMissing({ vars: [] })
      .append("vars", [varItem])
      .commit();
    return existing._id;
  }

  const doc = await writeClient.create({
    _type: "envGroup",
    spaceSlug,
    projectName,
    vars: [varItem],
  });
  return doc._id;
}

export async function updateEnvVar(
  groupId: string,
  varId: string,
  updates: { key?: string; encryptedValue?: string },
) {
  const group = await client.fetch<{ vars: Array<{ id: string; _key: string }> }>(
    `*[_type == "envGroup" && _id == $groupId][0]{vars[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const v = group.vars.find((item) => item.id === varId);
  if (!v) return;

  const patch = writeClient.patch(groupId);
  if (updates.key) patch.set({ [`vars[_key=="${v._key}"].key`]: updates.key });
  if (updates.encryptedValue) patch.set({ [`vars[_key=="${v._key}"].encryptedValue`]: updates.encryptedValue });
  await patch.commit();
}

export async function deleteEnvVar(groupId: string, varId: string) {
  const group = await client.fetch<{ vars: Array<{ id: string; _key: string }> }>(
    `*[_type == "envGroup" && _id == $groupId][0]{vars[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const v = group.vars.find((item) => item.id === varId);
  if (!v) return;

  await writeClient.patch(groupId).unset([`vars[_key=="${v._key}"]`]).commit();
}

export async function toggleEnvFavorite(groupId: string, varId: string, isFavorite: boolean) {
  const group = await client.fetch<{ vars: Array<{ id: string; _key: string }> }>(
    `*[_type == "envGroup" && _id == $groupId][0]{vars[]{id, _key}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const v = group.vars.find((item) => item.id === varId);
  if (!v) return;

  await writeClient.patch(groupId).set({ [`vars[_key=="${v._key}"].isFavorite`]: isFavorite }).commit();
}

export async function updateEnvLastUsed(groupId: string, varId: string) {
  const group = await client.fetch<{ vars: Array<{ id: string; _key: string; usageCount: number }> }>(
    `*[_type == "envGroup" && _id == $groupId][0]{vars[]{id, _key, usageCount}}`,
    { groupId } as Record<string, unknown>,
  );
  if (!group) return;
  const v = group.vars.find((item) => item.id === varId);
  if (!v) return;

  await writeClient
    .patch(groupId)
    .set({
      [`vars[_key=="${v._key}"].lastUsed`]: new Date().toISOString(),
      [`vars[_key=="${v._key}"].usageCount`]: (v.usageCount ?? 0) + 1,
    })
    .commit();
}
