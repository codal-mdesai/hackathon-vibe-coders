import { defineType, defineField } from "sanity";

export const shareLink = defineType({
  name: "shareLink",
  title: "Share Link",
  type: "document",
  fields: [
    defineField({ name: "token", title: "Token", type: "string", validation: (r) => r.required() }),
    defineField({ name: "resourceType", title: "Resource Type", type: "string", validation: (r) => r.required() }),
    defineField({ name: "resourceId", title: "Resource ID", type: "string", validation: (r) => r.required() }),
    defineField({ name: "expiresAt", title: "Expires At", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "createdBy", title: "Created By", type: "string" }),
  ],
});
