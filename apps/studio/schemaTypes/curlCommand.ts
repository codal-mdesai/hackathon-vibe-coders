import { defineType, defineField } from 'sanity'

export const curlCommandSchema = defineType({
  name: 'curlCommand',
  title: 'CURL Command',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'label', type: 'string', title: 'Label', validation: (Rule) => Rule.required() }),
    defineField({ name: 'command', type: 'text', title: 'Command', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', type: 'string', title: 'Category', validation: (Rule) => Rule.required() }),
    defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
    defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'category' },
  },
})

export type CurlCommand = {
  _id: string
  _type: 'curlCommand'
  spaceSlug: string
  label: string
  command: string
  category: string
  isFavorite: boolean
  lastUsed?: string
}
