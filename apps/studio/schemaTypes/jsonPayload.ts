import { defineType, defineField } from "sanity";

export const jsonPayload = defineType({
  name: "jsonPayload",
  title: "JSON Payload",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "projectName", title: "Project Name", type: "string" }),
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "payload", title: "Payload", type: "text" }),
    defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
    defineField({ name: "lastUsed", title: "Last Used", type: "datetime" }),
  ],
});
