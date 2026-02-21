import { groq } from 'next-sanity'
import type { GqlQueryDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const gqlQueriesQuery = groq`
  *[_type == "gqlQuery" && spaceSlug == $spaceSlug] | order(projectName asc, name asc) {
    _id, _type, spaceSlug, projectName, name, query, variables,
    isFavorite, usageCount, lastUsed
  }
`

export async function getGqlQueries(spaceSlug: string): Promise<GqlQueryDoc[]> {
  return client.fetch<GqlQueryDoc[]>(gqlQueriesQuery, { spaceSlug })
}

export const top3GqlQueriesQuery = groq`
  *[_type == "gqlQuery" && spaceSlug == $spaceSlug] | order(usageCount desc) [0...3] {
    _id, name, projectName, query, variables, isFavorite, usageCount, lastUsed
  }
`
