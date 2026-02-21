'use server'

import { writeClient } from '@/sanity/lib/write-client'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import type { SpaceDoc } from '@/types/sanity'

export async function createSpace(slug: string): Promise<SpaceDoc> {
  const now = new Date().toISOString()
  const doc = {
    _type: 'space',
    slug,
    displayName: 'My Space',
    accentColor: '#6366f1',
    createdAt: now,
  }
  const created = await writeClient.create(doc)
  return created as unknown as SpaceDoc
}

export async function getSpaceBySlug(slug: string): Promise<SpaceDoc | null> {
  return client.fetch<SpaceDoc | null>(
    groq`*[_type == "space" && slug == $slug][0]`,
    { slug } as Record<string, string>,
  )
}

export async function updateSpaceAccent(slug: string, accentColor: string): Promise<void> {
  const space = await getSpaceBySlug(slug)
  if (!space) return
  await writeClient.patch(space._id).set({ accentColor }).commit()
}

export async function updateSpaceName(slug: string, displayName: string): Promise<void> {
  const space = await getSpaceBySlug(slug)
  if (!space) return
  await writeClient.patch(space._id).set({ displayName }).commit()
}
