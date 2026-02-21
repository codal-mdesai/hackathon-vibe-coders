import { groq } from 'next-sanity'
import type { JsonPayloadDoc, CurlCommandDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const jsonPayloadsQuery = groq`
  *[_type == "jsonPayload" && spaceSlug == $spaceSlug] | order(projectName asc, name asc) {
    _id, _type, spaceSlug, projectName, name, payload, isFavorite, lastUsed
  }
`

export const curlCommandsQuery = groq`
  *[_type == "curlCommand" && spaceSlug == $spaceSlug] | order(category asc, label asc) {
    _id, _type, spaceSlug, label, command, category, isFavorite, lastUsed
  }
`

export async function getJsonPayloads(spaceSlug: string): Promise<JsonPayloadDoc[]> {
  return client.fetch<JsonPayloadDoc[]>(jsonPayloadsQuery, { spaceSlug })
}

export async function getCurlCommands(spaceSlug: string): Promise<CurlCommandDoc[]> {
  return client.fetch<CurlCommandDoc[]>(curlCommandsQuery, { spaceSlug })
}

export const top3PayloadsQuery = groq`
  {
    "json": *[_type == "jsonPayload" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
      _id, name, projectName, payload, isFavorite, lastUsed
    },
    "curl": *[_type == "curlCommand" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
      _id, label, command, category, isFavorite, lastUsed
    }
  }
`
