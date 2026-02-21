'use server'

import { writeClient } from '@/sanity/lib/write-client'
import { generateShareToken } from '@/lib/share'

export async function generateShareLink(
  spaceSlug: string,
  resourceType: string,
  resourceId: string,
  hours: number,
): Promise<string> {
  const token = generateShareToken()
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  await writeClient.create({
    _type: 'shareLink',
    token,
    resourceType,
    resourceId,
    expiresAt,
    createdBy: spaceSlug,
  })

  return token
}
