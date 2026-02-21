import { defineType, defineField } from "sanity";

export const pin = defineType({
  name: "pin",
  title: "Pin",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({ name: "addedBy", title: "Added By", type: "string" }),
    defineField({ name: "color", title: "Color", type: "string" }),
    defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
  ],
});
