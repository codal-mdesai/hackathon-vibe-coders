import { defineType, defineField } from 'sanity'

export const pinSchema = defineType({
  name: 'pin',
  title: 'Pin',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'url', type: 'url', title: 'URL', validation: (Rule) => Rule.required() }),
    defineField({ name: 'title', type: 'string', title: 'Title', validation: (Rule) => Rule.required() }),
    defineField({ name: 'tags', type: 'array', title: 'Tags', of: [{ type: 'string' }] }),
    defineField({ name: 'addedBy', type: 'string', title: 'Added By' }),
    defineField({
      name: 'color',
      type: 'string',
      title: 'Color',
      initialValue: 'zinc',
      options: {
        list: ['zinc', 'violet', 'blue', 'green', 'amber', 'red'],
      },
    }),
    defineField({ name: 'createdAt', type: 'datetime', title: 'Created At' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'url' },
  },
})

export type Pin = {
  _id: string
  _type: 'pin'
  spaceSlug: string
  url: string
  title: string
  tags: string[]
  addedBy?: string
  color: string
  createdAt: string
}
