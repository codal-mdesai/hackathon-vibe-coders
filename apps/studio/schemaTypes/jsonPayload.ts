import { defineType, defineField } from 'sanity'

export const jsonPayloadSchema = defineType({
  name: 'jsonPayload',
  title: 'JSON Payload',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'projectName', type: 'string', title: 'Project Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'payload', type: 'text', title: 'Payload (JSON)', validation: (Rule) => Rule.required() }),
    defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
    defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'projectName' },
  },
})

export type JsonPayload = {
  _id: string
  _type: 'jsonPayload'
  spaceSlug: string
  projectName: string
  name: string
  payload: string
  isFavorite: boolean
  lastUsed?: string
}
