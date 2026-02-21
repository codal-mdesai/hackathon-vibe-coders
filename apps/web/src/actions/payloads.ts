'use server'

import { writeClient } from '@/sanity/lib/write-client'
import type { JsonPayloadDoc, CurlCommandDoc } from '@/types/sanity'

// JSON Payloads
export async function createJsonPayload(
  spaceSlug: string,
  projectName: string,
  name: string,
  payload: string,
): Promise<JsonPayloadDoc> {
  return writeClient.create({
    _type: 'jsonPayload',
    spaceSlug, projectName, name, payload,
    isFavorite: false,
  }) as unknown as JsonPayloadDoc
}

export async function updateJsonPayload(id: string, projectName: string, name: string, payload: string): Promise<void> {
  await writeClient.patch(id).set({ projectName, name, payload }).commit()
}

export async function deleteJsonPayload(id: string): Promise<void> {
  await writeClient.delete(id)
}

export async function toggleJsonFavorite(id: string, isFavorite: boolean): Promise<void> {
  await writeClient.patch(id).set({ isFavorite }).commit()
}

export async function updateJsonLastUsed(id: string): Promise<void> {
  await writeClient.patch(id).set({ lastUsed: new Date().toISOString() }).commit()
}

// CURL Commands
export async function createCurlCommand(
  spaceSlug: string,
  label: string,
  command: string,
  category: string,
): Promise<CurlCommandDoc> {
  return writeClient.create({
    _type: 'curlCommand',
    spaceSlug, label, command, category,
    isFavorite: false,
  }) as unknown as CurlCommandDoc
}

export async function updateCurlCommand(id: string, label: string, command: string, category: string): Promise<void> {
  await writeClient.patch(id).set({ label, command, category }).commit()
}

export async function deleteCurlCommand(id: string): Promise<void> {
  await writeClient.delete(id)
}

export async function toggleCurlFavorite(id: string, isFavorite: boolean): Promise<void> {
  await writeClient.patch(id).set({ isFavorite }).commit()
}

export async function updateCurlLastUsed(id: string): Promise<void> {
  await writeClient.patch(id).set({ lastUsed: new Date().toISOString() }).commit()
}
