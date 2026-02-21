import { groq } from 'next-sanity'
import type { ApiKeyGroup } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const apiKeyGroupsQuery = groq`
  *[_type == "apiKeyGroup" && spaceSlug == $spaceSlug] | order(storeName asc) {
    _id, _type, spaceSlug, storeName,
    keys[] {
      _key, id, label, encryptedValue,
      isFavorite, usageCount, lastUsed
    }
  }
`

export async function getApiKeyGroups(spaceSlug: string): Promise<ApiKeyGroup[]> {
  return client.fetch<ApiKeyGroup[]>(apiKeyGroupsQuery, { spaceSlug })
}

export const apiKeyCountQuery = groq`
  count(*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug].keys[])
`

export async function getApiKeyCount(spaceSlug: string): Promise<number> {
  const groups = await client.fetch<ApiKeyGroup[]>(apiKeyGroupsQuery, { spaceSlug })
  return groups.reduce((sum, g) => sum + (g.keys?.length ?? 0), 0)
}

export const top3ApiKeysQuery = groq`
  *[_type == "apiKeyGroup" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
    _id, storeName,
    "topKey": keys | order(usageCount desc) [0] {
      _key, id, label, encryptedValue, isFavorite, usageCount, lastUsed
    }
  }
`
