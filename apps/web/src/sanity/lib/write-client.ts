import { createClient } from 'next-sanity'

// Server-side only. Never import in client components.
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})
