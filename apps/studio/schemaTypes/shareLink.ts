import { defineType, defineField } from 'sanity'

export const shareLinkSchema = defineType({
  name: 'shareLink',
  title: 'Share Link',
  type: 'document',
  fields: [
    defineField({ name: 'token', type: 'string', title: 'Token', validation: (Rule) => Rule.required() }),
    defineField({ name: 'resourceType', type: 'string', title: 'Resource Type', validation: (Rule) => Rule.required() }),
    defineField({ name: 'resourceId', type: 'string', title: 'Resource ID', validation: (Rule) => Rule.required() }),
    defineField({ name: 'expiresAt', type: 'datetime', title: 'Expires At', validation: (Rule) => Rule.required() }),
    defineField({ name: 'createdBy', type: 'string', title: 'Created By' }),
  ],
  preview: {
    select: { title: 'token', subtitle: 'resourceType' },
  },
})

export type ShareLink = {
  _id: string
  _type: 'shareLink'
  token: string
  resourceType: string
  resourceId: string
  expiresAt: string
  createdBy?: string
}
