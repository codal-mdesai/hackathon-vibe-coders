import { defineType, defineField } from "sanity";

export const user = defineType({
  name: "user",
  title: "User",
  type: "document",
  fields: [
    defineField({ name: "email", title: "Email", type: "string", validation: (r) => r.required() }),
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({
      name: "spaces",
      title: "Spaces",
      type: "array",
      of: [{ type: "reference", to: [{ type: "space" }] }],
    }),
    defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
  ],
});
