'use server'

import { writeClient } from '@/sanity/lib/write-client'
import type { GqlQueryDoc } from '@/types/sanity'

export async function createQuery(
  spaceSlug: string,
  projectName: string,
  name: string,
  query: string,
  variables?: string,
): Promise<GqlQueryDoc> {
  return writeClient.create({
    _type: 'gqlQuery',
    spaceSlug,
    projectName,
    name,
    query,
    variables: variables ?? '',
    isFavorite: false,
    usageCount: 0,
  }) as unknown as GqlQueryDoc
}

export async function updateQuery(
  id: string,
  projectName: string,
  name: string,
  query: string,
  variables?: string,
): Promise<void> {
  await writeClient.patch(id).set({ projectName, name, query, variables: variables ?? '' }).commit()
}

export async function deleteQuery(id: string): Promise<void> {
  await writeClient.delete(id)
}

export async function toggleGqlFavorite(id: string, isFavorite: boolean): Promise<void> {
  await writeClient.patch(id).set({ isFavorite }).commit()
}

export async function incrementGqlUsage(id: string, currentCount: number): Promise<void> {
  await writeClient
    .patch(id)
    .set({ usageCount: currentCount + 1, lastUsed: new Date().toISOString() })
    .commit()
}
