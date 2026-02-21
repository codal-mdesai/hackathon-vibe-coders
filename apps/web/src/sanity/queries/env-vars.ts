import { groq } from 'next-sanity'
import type { EnvGroupDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const envGroupsQuery = groq`
  *[_type == "envGroup" && spaceSlug == $spaceSlug] | order(projectName asc) {
    _id, _type, spaceSlug, projectName,
    vars[] {
      _key, id, key, encryptedValue,
      isFavorite, usageCount, lastUsed
    }
  }
`

export async function getEnvGroups(spaceSlug: string): Promise<EnvGroupDoc[]> {
  return client.fetch<EnvGroupDoc[]>(envGroupsQuery, { spaceSlug })
}

export const top3EnvVarsQuery = groq`
  *[_type == "envGroup" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
    _id, projectName,
    "topVar": vars | order(lastUsed desc) [0] {
      _key, id, key, encryptedValue, isFavorite, usageCount, lastUsed
    }
  }
`
