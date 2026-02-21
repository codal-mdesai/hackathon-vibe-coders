'use server'

import { writeClient } from '@/sanity/lib/write-client'
import type { PinDoc } from '@/types/sanity'

export async function createPin(
  spaceSlug: string,
  url: string,
  title: string,
  tags: string[],
  color: string,
  addedBy: string,
  gridX: number,
  gridY: number,
): Promise<PinDoc> {
  return writeClient.create({
    _type: 'pin',
    spaceSlug,
    url,
    title,
    tags,
    color,
    addedBy,
    gridX,
    gridY,
    createdAt: new Date().toISOString(),
  }) as unknown as PinDoc
}

export async function updatePinPosition(
  pinId: string,
  gridX: number,
  gridY: number,
): Promise<void> {
  await writeClient.patch(pinId).set({ gridX, gridY }).commit()
}

export async function softDeletePin(pinId: string): Promise<void> {
  await writeClient.patch(pinId).set({ deletedAt: new Date().toISOString() }).commit()
}

export async function restorePin(pinId: string): Promise<void> {
  await writeClient.patch(pinId).unset(['deletedAt']).commit()
}

export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DevPanel/1.0 LinkPreview' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match?.[1]?.trim() ?? null
  } catch {
    return null
  }
}
