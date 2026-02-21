import { defineType, defineField } from 'sanity'

export const spaceSchema = defineType({
  name: 'space',
  title: 'Space',
  type: 'document',
  fields: [
    defineField({ name: 'slug', type: 'string', title: 'Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'displayName', type: 'string', title: 'Display Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'accentColor', type: 'string', title: 'Accent Color', initialValue: '#6366f1' }),
    defineField({ name: 'createdAt', type: 'datetime', title: 'Created At' }),
    defineField({ name: 'ownerId', type: 'string', title: 'Owner ID' }),
  ],
  preview: {
    select: { title: 'displayName', subtitle: 'slug' },
  },
})

export type Space = {
  _id: string
  _type: 'space'
  slug: string
  displayName: string
  accentColor: string
  createdAt: string
  ownerId?: string
}
