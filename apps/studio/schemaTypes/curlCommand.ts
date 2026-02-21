import { defineType, defineField } from "sanity";

export const curlCommand = defineType({
  name: "curlCommand",
  title: "CURL Command",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "command", title: "Command", type: "text" }),
    defineField({ name: "category", title: "Category", type: "string" }),
    defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
    defineField({ name: "lastUsed", title: "Last Used", type: "datetime" }),
  ],
});
