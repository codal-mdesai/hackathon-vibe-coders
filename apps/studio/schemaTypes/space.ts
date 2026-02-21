import { defineType, defineField } from "sanity";

export const space = defineType({
  name: "space",
  title: "Space",
  type: "document",
  fields: [
    defineField({ name: "slug", title: "Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "displayName", title: "Display Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "accentColor", title: "Accent Color", type: "string" }),
    defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
    defineField({ name: "ownerId", title: "Owner ID", type: "string" }),
  ],
});
