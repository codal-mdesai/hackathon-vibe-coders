import { defineType, defineField } from 'sanity'

export const deployNoteSchema = defineType({
  name: 'deployNote',
  title: 'Deploy Note',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'projectName', type: 'string', title: 'Project Name', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'techAreas',
      type: 'array',
      title: 'Tech Areas',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'id', type: 'string', title: 'ID' }),
            defineField({ name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() }),
            defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
            defineField({ name: 'notes', type: 'text', title: 'Notes' }),
            defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
            defineField({
              name: 'commands',
              type: 'array',
              title: 'Commands',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'step', type: 'number', title: 'Step' }),
                    defineField({ name: 'command', type: 'string', title: 'Command', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'description', type: 'string', title: 'Description' }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'projectName', subtitle: 'spaceSlug' },
  },
})

export type DeployCommand = {
  _key: string
  step: number
  command: string
  description?: string
}

export type TechArea = {
  _key: string
  id: string
  name: string
  isFavorite: boolean
  notes?: string
  lastUsed?: string
  commands: DeployCommand[]
}

export type DeployNote = {
  _id: string
  _type: 'deployNote'
  spaceSlug: string
  projectName: string
  techAreas: TechArea[]
}
