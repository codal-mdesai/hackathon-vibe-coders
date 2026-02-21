import { defineType, defineField } from 'sanity'

export const gqlQuerySchema = defineType({
  name: 'gqlQuery',
  title: 'GraphQL Query',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'projectName', type: 'string', title: 'Project Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'query', type: 'text', title: 'Query', validation: (Rule) => Rule.required() }),
    defineField({ name: 'variables', type: 'text', title: 'Variables (JSON)' }),
    defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
    defineField({ name: 'usageCount', type: 'number', title: 'Usage Count', initialValue: 0 }),
    defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'projectName' },
  },
})

export type GqlQuery = {
  _id: string
  _type: 'gqlQuery'
  spaceSlug: string
  projectName: string
  name: string
  query: string
  variables?: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}
