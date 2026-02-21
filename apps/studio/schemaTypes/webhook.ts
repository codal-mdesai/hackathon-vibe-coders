import { defineType, defineField } from "sanity";

export const webhook = defineType({
  name: "webhook",
  title: "Webhook",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "projectName", title: "Project Name", type: "string" }),
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", title: "URL", type: "url" }),
    defineField({
      name: "headers",
      title: "Headers",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "key", title: "Key", type: "string" }),
            defineField({ name: "value", title: "Value", type: "string" }),
          ],
        },
      ],
    }),
    defineField({ name: "payload", title: "Payload", type: "text" }),
    defineField({
      name: "comments",
      title: "Comments",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "field", title: "Field", type: "string" }),
            defineField({ name: "comment", title: "Comment", type: "string" }),
          ],
        },
      ],
    }),
    defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
    defineField({ name: "lastUsed", title: "Last Used", type: "datetime" }),
  ],
});
