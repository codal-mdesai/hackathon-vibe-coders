import { defineType, defineField } from "sanity";

export const apiKeyGroup = defineType({
  name: "apiKeyGroup",
  title: "API Key Group",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "storeName", title: "Store Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "keys",
      title: "Keys",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({ name: "label", title: "Label", type: "string" }),
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
