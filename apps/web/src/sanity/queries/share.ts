import { groq } from 'next-sanity'
import type { ShareLinkDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const shareLinkByTokenQuery = groq`
  *[_type == "shareLink" && token == $token][0] {
    _id, _type, token, resourceType, resourceId, expiresAt, createdBy
  }
`

export async function getShareLinkByToken(token: string): Promise<ShareLinkDoc | null> {
  const params: Record<string, string> = { token }
  return client.fetch<ShareLinkDoc | null>(shareLinkByTokenQuery, params)
}
