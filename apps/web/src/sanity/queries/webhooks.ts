import { groq } from 'next-sanity'
import type { WebhookDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const webhooksQuery = groq`
  *[_type == "webhook" && spaceSlug == $spaceSlug] | order(projectName asc, name asc) {
    _id, _type, spaceSlug, projectName, name, url,
    headers[] { _key, key, value },
    payload,
    comments[] { _key, field, comment },
    isFavorite, lastUsed
  }
`

export async function getWebhooks(spaceSlug: string): Promise<WebhookDoc[]> {
  return client.fetch<WebhookDoc[]>(webhooksQuery, { spaceSlug })
}

export const top3WebhooksQuery = groq`
  *[_type == "webhook" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
    _id, name, projectName, url, payload, isFavorite, lastUsed
  }
`
