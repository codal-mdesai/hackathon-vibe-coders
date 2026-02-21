import { defineType, defineField } from 'sanity'

export const webhookSchema = defineType({
  name: 'webhook',
  title: 'Webhook',
  type: 'document',
  fields: [
    defineField({ name: 'spaceSlug', type: 'string', title: 'Space Slug', validation: (Rule) => Rule.required() }),
    defineField({ name: 'projectName', type: 'string', title: 'Project Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'name', type: 'string', title: 'Name', validation: (Rule) => Rule.required() }),
    defineField({ name: 'url', type: 'string', title: 'URL', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'headers',
      type: 'array',
      title: 'Headers',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'key', type: 'string', title: 'Header Key', validation: (Rule) => Rule.required() }),
            defineField({ name: 'value', type: 'string', title: 'Header Value' }),
          ],
        },
      ],
    }),
    defineField({ name: 'payload', type: 'text', title: 'Payload (JSON)' }),
    defineField({
      name: 'comments',
      type: 'array',
      title: 'Field Comments',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'field', type: 'string', title: 'Field Path', validation: (Rule) => Rule.required() }),
            defineField({ name: 'comment', type: 'string', title: 'Comment', validation: (Rule) => Rule.required() }),
          ],
        },
      ],
    }),
    defineField({ name: 'isFavorite', type: 'boolean', title: 'Favorite', initialValue: false }),
    defineField({ name: 'lastUsed', type: 'datetime', title: 'Last Used' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'projectName' },
  },
})

export type WebhookHeader = {
  _key: string
  key: string
  value: string
}

export type WebhookComment = {
  _key: string
  field: string
  comment: string
}

export type Webhook = {
  _id: string
  _type: 'webhook'
  spaceSlug: string
  projectName: string
  name: string
  url: string
  headers: WebhookHeader[]
  payload?: string
  comments: WebhookComment[]
  isFavorite: boolean
  lastUsed?: string
}
