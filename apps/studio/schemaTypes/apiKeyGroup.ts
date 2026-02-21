import { defineType, defineField } from 'sanity'

export const apiKeyGroupSchema = defineType({
  name: 'apiKeyGroup',
  title: 'API Key Group',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'storeName', type: 'string', title: 'Store Name', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'keys',
      type: 'array',
      title: 'Keys',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'id', type: 'string', title: 'ID' }),
            defineField({ name: 'label', type: 'string', title: 'Label', validation: (Rule) => Rule.required() }),
            defineField({ name: 'encryptedValue', type: 'string', title: 'Encrypted Value', validation: (Rule) => Rule.required() }),
            defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
            defineField({ name: 'usageCount', type: 'number', title: 'Usage Count', initialValue: 0 }),
            defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'storeName', subtitle: 'spaceSlug' },
  },
})

export type ApiKeyEntry = {
  _key: string
  id: string
  label: string
  encryptedValue: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}

export type ApiKeyGroup = {
  _id: string
  _type: 'apiKeyGroup'
  spaceSlug: string
  storeName: string
  keys: ApiKeyEntry[]
}
