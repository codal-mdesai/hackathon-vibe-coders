'use server'

import { writeClient } from '@/sanity/lib/write-client'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import type { DeployNoteDoc, TechArea } from '@/types/sanity'

async function getNoteById(id: string): Promise<DeployNoteDoc | null> {
  return client.fetch<DeployNoteDoc | null>(
    groq`*[_type == "deployNote" && _id == $id][0]`,
    { id } as Record<string, string>,
  )
}

export async function createDeployNote(
  spaceSlug: string,
  projectName: string,
  techAreaName: string,
  commands: { step: number; command: string; description?: string }[],
  notes?: string,
): Promise<DeployNoteDoc> {
  const areaId = crypto.randomUUID()
  const techArea: TechArea = {
    _key: areaId,
    id: areaId,
    name: techAreaName,
    isFavorite: false,
    notes,
    commands: commands.map((c, i) => ({
      _key: crypto.randomUUID(),
      step: c.step ?? i + 1,
      command: c.command,
      description: c.description,
    })),
  }

  const existing = await client.fetch<DeployNoteDoc | null>(
    groq`*[_type == "deployNote" && spaceSlug == $spaceSlug && projectName == $projectName][0]`,
    { spaceSlug, projectName } as Record<string, string>,
  )

  if (existing) {
    return writeClient
      .patch(existing._id)
      .setIfMissing({ techAreas: [] })
      .append('techAreas', [techArea])
      .commit() as unknown as DeployNoteDoc
  }

  return writeClient.create({
    _type: 'deployNote',
    spaceSlug,
    projectName,
    techAreas: [techArea],
  }) as unknown as DeployNoteDoc
}

export async function updateDeployNote(
  noteId: string,
  areaKey: string,
  name: string,
  commands: { step: number; command: string; description?: string }[],
  notes?: string,
): Promise<void> {
  await writeClient
    .patch(noteId)
    .set({
      [`techAreas[_key == "${areaKey}"].name`]: name,
      [`techAreas[_key == "${areaKey}"].notes`]: notes ?? '',
      [`techAreas[_key == "${areaKey}"].commands`]: commands.map((c, i) => ({
        _key: crypto.randomUUID(),
        step: c.step ?? i + 1,
        command: c.command,
        description: c.description ?? '',
      })),
    })
    .commit()
}

export async function deleteDeployNote(noteId: string, areaKey: string): Promise<void> {
  await writeClient
    .patch(noteId)
    .unset([`techAreas[_key == "${areaKey}"]`])
    .commit()
}

export async function toggleDeployFavorite(
  noteId: string,
  areaKey: string,
  isFavorite: boolean,
): Promise<void> {
  await writeClient
    .patch(noteId)
    .set({ [`techAreas[_key == "${areaKey}"].isFavorite`]: isFavorite })
    .commit()
}

export async function updateDeployLastUsed(noteId: string, areaKey: string): Promise<void> {
  await writeClient
    .patch(noteId)
    .set({ [`techAreas[_key == "${areaKey}"].lastUsed`]: new Date().toISOString() })
    .commit()
}

export async function generateReadme(noteId: string, areaKey: string): Promise<string> {
  const note = await getNoteById(noteId)
  if (!note) return ''
  const area = note.techAreas.find((a) => a._key === areaKey)
  if (!area) return ''

  const lines: string[] = [
    `# ${note.projectName} — ${area.name}`,
    '',
    '## Commands',
    '',
    ...area.commands.map(
      (c) => `${c.step}. \`${c.command}\`${c.description ? ` — ${c.description}` : ''}`,
    ),
  ]

  if (area.notes?.trim()) {
    lines.push('', '## Notes', '', area.notes)
  }

  return lines.join('\n')
}
