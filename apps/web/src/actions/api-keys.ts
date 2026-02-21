'use server'

import { writeClient } from '@/sanity/lib/write-client'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import type { ApiKeyGroup } from '@/types/sanity'

async function getGroupById(id: string): Promise<ApiKeyGroup | null> {
  return client.fetch<ApiKeyGroup | null>(
    groq`*[_type == "apiKeyGroup" && _id == $id][0] { _id, spaceSlug, storeName, keys[] { _key, id, label, encryptedValue, isFavorite, usageCount, lastUsed } }`,
    { id } as Record<string, string>,
  )
}

export async function createApiKeyGroup(
  spaceSlug: string,
  storeName: string,
): Promise<ApiKeyGroup> {
  const doc = { _type: 'apiKeyGroup', spaceSlug, storeName, keys: [] }
  return writeClient.create(doc) as unknown as ApiKeyGroup
}

export async function createApiKey(
  spaceSlug: string,
  storeName: string,
  label: string,
  encryptedValue: string,
): Promise<string> {
  // Find or create group for this storeName
  const existing = await client.fetch<ApiKeyGroup | null>(
    groq`*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug && storeName == $storeName][0]`,
    { spaceSlug, storeName } as Record<string, string>,
  )

  const keyId = crypto.randomUUID()
  const newKey = {
    _key: keyId,
    id: keyId,
    label,
    encryptedValue,
    isFavorite: false,
    usageCount: 0,
  }

  if (existing) {
    await writeClient
      .patch(existing._id)
      .setIfMissing({ keys: [] })
      .append('keys', [newKey])
      .commit()
  } else {
    await writeClient.create({
      _type: 'apiKeyGroup',
      spaceSlug,
      storeName,
      keys: [newKey],
    })
  }
  return keyId
}

export async function updateApiKey(
  groupId: string,
  keyKey: string,
  label: string,
  encryptedValue: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) return
  const idx = group.keys.findIndex((k) => k._key === keyKey)
  if (idx === -1) return
  await writeClient
    .patch(groupId)
    .set({
      [`keys[_key == "${keyKey}"].label`]: label,
      [`keys[_key == "${keyKey}"].encryptedValue`]: encryptedValue,
    })
    .commit()
}

export async function deleteApiKey(groupId: string, keyKey: string): Promise<void> {
  await writeClient
    .patch(groupId)
    .unset([`keys[_key == "${keyKey}"]`])
    .commit()
}

export async function toggleApiKeyFavorite(
  groupId: string,
  keyKey: string,
  isFavorite: boolean,
): Promise<void> {
  await writeClient
    .patch(groupId)
    .set({ [`keys[_key == "${keyKey}"].isFavorite`]: isFavorite })
    .commit()
}

export async function incrementApiKeyUsage(groupId: string, keyKey: string): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) return
  const key = group.keys.find((k) => k._key === keyKey)
  if (!key) return
  await writeClient
    .patch(groupId)
    .set({
      [`keys[_key == "${keyKey}"].usageCount`]: (key.usageCount ?? 0) + 1,
      [`keys[_key == "${keyKey}"].lastUsed`]: new Date().toISOString(),
    })
    .commit()
}
