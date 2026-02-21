import { defineType, defineField } from "sanity";

export const envGroup = defineType({
  name: "envGroup",
  title: "Env Group",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "projectName", title: "Project Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "vars",
      title: "Variables",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({ name: "key", title: "Key", type: "string" }),
            defineField({ name: "encryptedValue", title: "Encrypted Value", type: "string" }),
            defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
            defineField({ name: "usageCount", title: "Usage Count", type: "number", initialValue: 0 }),
            defineField({ name: "lastUsed", title: "Last Used", type: "datetime" }),
          ],
        },
      ],
    }),
  ],
});
