'use server'

import { writeClient } from '@/sanity/lib/write-client'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import type { EnvGroupDoc } from '@/types/sanity'

async function getGroupById(id: string): Promise<EnvGroupDoc | null> {
  return client.fetch<EnvGroupDoc | null>(
    groq`*[_type == "envGroup" && _id == $id][0] { _id, spaceSlug, projectName, vars[] { _key, id, key, encryptedValue, isFavorite, usageCount, lastUsed } }`,
    { id } as Record<string, string>,
  )
}

export async function createEnvVar(
  spaceSlug: string,
  projectName: string,
  key: string,
  encryptedValue: string,
): Promise<string> {
  const existing = await client.fetch<EnvGroupDoc | null>(
    groq`*[_type == "envGroup" && spaceSlug == $spaceSlug && projectName == $projectName][0]`,
    { spaceSlug, projectName } as Record<string, string>,
  )

  const varId = crypto.randomUUID()
  const newVar = {
    _key: varId,
    id: varId,
    key,
    encryptedValue,
    isFavorite: false,
    usageCount: 0,
  }

  if (existing) {
    await writeClient
      .patch(existing._id)
      .setIfMissing({ vars: [] })
      .append('vars', [newVar])
      .commit()
  } else {
    await writeClient.create({
      _type: 'envGroup',
      spaceSlug,
      projectName,
      vars: [newVar],
    })
  }
  return varId
}

export async function updateEnvVar(
  groupId: string,
  varKey: string,
  key: string,
  encryptedValue: string,
): Promise<void> {
  await writeClient
    .patch(groupId)
    .set({
      [`vars[_key == "${varKey}"].key`]: key,
      [`vars[_key == "${varKey}"].encryptedValue`]: encryptedValue,
    })
    .commit()
}

export async function deleteEnvVar(groupId: string, varKey: string): Promise<void> {
  await writeClient
    .patch(groupId)
    .unset([`vars[_key == "${varKey}"]`])
    .commit()
}

export async function toggleEnvVarFavorite(
  groupId: string,
  varKey: string,
  isFavorite: boolean,
): Promise<void> {
  await writeClient
    .patch(groupId)
    .set({ [`vars[_key == "${varKey}"].isFavorite`]: isFavorite })
    .commit()
}

export async function updateEnvVarLastUsed(groupId: string, varKey: string): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) return
  const v = group.vars.find((x) => x._key === varKey)
  if (!v) return
  await writeClient
    .patch(groupId)
    .set({
      [`vars[_key == "${varKey}"].usageCount`]: (v.usageCount ?? 0) + 1,
      [`vars[_key == "${varKey}"].lastUsed`]: new Date().toISOString(),
    })
    .commit()
}
