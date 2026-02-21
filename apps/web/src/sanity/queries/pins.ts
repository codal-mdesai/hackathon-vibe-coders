import { groq } from 'next-sanity'
import type { PinDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const pinsQuery = groq`
  *[_type == "pin" && spaceSlug == $spaceSlug] | order(createdAt desc) {
    _id, _type, spaceSlug, url, title, tags, addedBy, color, createdAt
  }
`

export async function getPins(spaceSlug: string): Promise<PinDoc[]> {
  return client.fetch<PinDoc[]>(pinsQuery, { spaceSlug })
}

export const top3PinsQuery = groq`
  *[_type == "pin" && spaceSlug == $spaceSlug] | order(createdAt desc) [0...3] {
    _id, url, title, tags, addedBy, color, createdAt
  }
`
