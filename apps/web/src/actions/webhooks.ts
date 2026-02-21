'use server'

import { writeClient } from '@/sanity/lib/write-client'
import type { WebhookDoc } from '@/types/sanity'

export async function createWebhook(
  spaceSlug: string,
  projectName: string,
  name: string,
  url: string,
  headers: { key: string; value: string }[],
  payload?: string,
  comments?: { field: string; comment: string }[],
): Promise<WebhookDoc> {
  return writeClient.create({
    _type: 'webhook',
    spaceSlug,
    projectName,
    name,
    url,
    headers: headers.map((h) => ({ _key: crypto.randomUUID(), ...h })),
    payload: payload ?? '',
    comments: (comments ?? []).map((c) => ({ _key: crypto.randomUUID(), ...c })),
    isFavorite: false,
  }) as unknown as WebhookDoc
}

export async function updateWebhook(
  id: string,
  projectName: string,
  name: string,
  url: string,
  headers: { key: string; value: string }[],
  payload?: string,
  comments?: { field: string; comment: string }[],
): Promise<void> {
  await writeClient.patch(id).set({
    projectName,
    name,
    url,
    headers: headers.map((h) => ({ _key: crypto.randomUUID(), ...h })),
    payload: payload ?? '',
    comments: (comments ?? []).map((c) => ({ _key: crypto.randomUUID(), ...c })),
  }).commit()
}

export async function deleteWebhook(id: string): Promise<void> {
  await writeClient.delete(id)
}

export async function toggleWebhookFavorite(id: string, isFavorite: boolean): Promise<void> {
  await writeClient.patch(id).set({ isFavorite }).commit()
}

export async function updateWebhookLastUsed(id: string): Promise<void> {
  await writeClient.patch(id).set({ lastUsed: new Date().toISOString() }).commit()
}
