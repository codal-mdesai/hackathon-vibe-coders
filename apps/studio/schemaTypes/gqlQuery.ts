import { defineType, defineField } from "sanity";

export const gqlQuery = defineType({
  name: "gqlQuery",
  title: "GraphQL Query",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "projectName", title: "Project Name", type: "string" }),
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "query", title: "Query", type: "text" }),
    defineField({ name: "variables", title: "Variables", type: "text" }),
    defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
    defineField({ name: "usageCount", title: "Usage Count", type: "number", initialValue: 0 }),
    defineField({ name: "lastUsed", title: "Last Used", type: "datetime" }),
  ],
});
