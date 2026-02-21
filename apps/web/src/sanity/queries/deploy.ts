import { groq } from 'next-sanity'
import type { DeployNoteDoc } from '@/types/sanity'
import { client } from '@/sanity/lib/client'

export const deployNotesQuery = groq`
  *[_type == "deployNote" && spaceSlug == $spaceSlug] | order(projectName asc) {
    _id, _type, spaceSlug, projectName,
    techAreas[] {
      _key, id, name, isFavorite, notes, lastUsed,
      commands[] { _key, step, command, description }
    }
  }
`

export async function getDeployNotes(spaceSlug: string): Promise<DeployNoteDoc[]> {
  return client.fetch<DeployNoteDoc[]>(deployNotesQuery, { spaceSlug })
}

export const top3DeployAreasQuery = groq`
  *[_type == "deployNote" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
    _id, projectName,
    "topArea": techAreas | order(lastUsed desc) [0] {
      _key, id, name, isFavorite, lastUsed,
      commands[] { _key, step, command, description }
    }
  }
`
