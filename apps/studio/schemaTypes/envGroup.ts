import { defineType, defineField } from 'sanity'

export const envGroupSchema = defineType({
  name: 'envGroup',
  title: 'Env Variable Group',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'projectName', type: 'string', title: 'Project Name', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'vars',
      type: 'array',
      title: 'Variables',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'id', type: 'string', title: 'ID' }),
            defineField({ name: 'key', type: 'string', title: 'Key', validation: (Rule) => Rule.required() }),
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
    select: { title: 'projectName', subtitle: 'spaceSlug' },
  },
})

export type EnvVarEntry = {
  _key: string
  id: string
  key: string
  encryptedValue: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}

export type EnvGroup = {
  _id: string
  _type: 'envGroup'
  spaceSlug: string
  projectName: string
  vars: EnvVarEntry[]
}
