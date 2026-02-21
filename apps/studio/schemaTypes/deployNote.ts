import { defineType, defineField } from "sanity";

export const deployNote = defineType({
  name: "deployNote",
  title: "Deploy Note",
  type: "document",
  fields: [
    defineField({ name: "spaceSlug", title: "Space Slug", type: "string", validation: (r) => r.required() }),
    defineField({ name: "projectName", title: "Project Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "techAreas",
      title: "Tech Areas",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "isFavorite", title: "Favorite", type: "boolean", initialValue: false }),
            defineField({ name: "notes", title: "Notes", type: "text" }),
            defineField({
              name: "commands",
              title: "Commands",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "step", title: "Step", type: "number" }),
                    defineField({ name: "command", title: "Command", type: "string" }),
                    defineField({ name: "description", title: "Description", type: "string" }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
});
