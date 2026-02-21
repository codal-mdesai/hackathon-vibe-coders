import { defineType, defineField } from 'sanity'

export const userSchema = defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    defineField({ name: 'email', type: 'string', title: 'Email', validation: (Rule) => Rule.required().email() }),
    defineField({ name: 'name', type: 'string', title: 'Name' }),
    defineField({
      name: 'spaces',
      type: 'array',
      title: 'Spaces',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'createdAt', type: 'datetime', title: 'Created At' }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'name' },
  },
})

export type User = {
  _id: string
  _type: 'user'
  email: string
  name?: string
  spaces: string[]
  createdAt: string
}
