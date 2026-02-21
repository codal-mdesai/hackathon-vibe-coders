import { groq } from 'next-sanity'
import type { PinDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const pinsQuery = groq`
  *[_type == "pin" && spaceSlug == $spaceSlug && !defined(deletedAt)] | order(createdAt asc) {
    _id, _type, spaceSlug, url, title, tags, addedBy, color, createdAt, gridX, gridY
  }
`

export async function getPins(spaceSlug: string): Promise<PinDoc[]> {
  return client.fetch<PinDoc[]>(pinsQuery, { spaceSlug })
}

export const top3PinsQuery = groq`
  *[_type == "pin" && spaceSlug == $spaceSlug && !defined(deletedAt)] | order(createdAt desc) [0...3] {
    _id, url, title, tags, addedBy, color, createdAt, gridX, gridY
  }
`
