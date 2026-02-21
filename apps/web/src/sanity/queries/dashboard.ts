import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'
import type {
  ApiKeyGroup,
  EnvGroupDoc,
  GqlQueryDoc,
  PinDoc,
  DeployNoteDoc,
  WebhookDoc,
  JsonPayloadDoc,
  CurlCommandDoc,
} from '@/types/sanity'

// Parallel top-3 per section for a given spaceSlug
export const dashboardQuery = groq`
  {
    "apiKeyGroups": *[_type == "apiKeyGroup" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
      _id, storeName,
      "topKey": keys | order(usageCount desc) [0] {
        _key, id, label, encryptedValue, isFavorite, usageCount, lastUsed
      }
    },
    "envGroups": *[_type == "envGroup" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
      _id, projectName,
      "topVar": vars | order(lastUsed desc) [0] {
        _key, id, key, encryptedValue, isFavorite, usageCount, lastUsed
      }
    },
    "gqlQueries": *[_type == "gqlQuery" && spaceSlug == $spaceSlug] | order(usageCount desc) [0...3] {
      _id, name, projectName, query, variables, isFavorite, usageCount, lastUsed
    },
    "pins": *[_type == "pin" && spaceSlug == $spaceSlug] | order(createdAt desc) [0...3] {
      _id, url, title, tags, addedBy, color, createdAt
    },
    "deployNotes": *[_type == "deployNote" && spaceSlug == $spaceSlug] | order(_createdAt desc) [0...3] {
      _id, projectName,
      "topArea": techAreas | order(lastUsed desc) [0] {
        _key, id, name, isFavorite, lastUsed,
        commands[] { _key, step, command, description }
      }
    },
    "webhooks": *[_type == "webhook" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
      _id, name, projectName, url, payload, isFavorite, lastUsed
    },
    "payloads": {
      "json": *[_type == "jsonPayload" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
        _id, name, projectName, payload, isFavorite, lastUsed
      },
      "curl": *[_type == "curlCommand" && spaceSlug == $spaceSlug] | order(lastUsed desc) [0...3] {
        _id, label, command, category, isFavorite, lastUsed
      }
    },
    "counts": {
      "apiKeys": count(*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug]),
      "envVars": count(*[_type == "envGroup" && spaceSlug == $spaceSlug]),
      "graphql": count(*[_type == "gqlQuery" && spaceSlug == $spaceSlug]),
      "pins": count(*[_type == "pin" && spaceSlug == $spaceSlug]),
      "deployNotes": count(*[_type == "deployNote" && spaceSlug == $spaceSlug]),
      "webhooks": count(*[_type == "webhook" && spaceSlug == $spaceSlug]),
      "payloads": count(*[_type == "jsonPayload" && spaceSlug == $spaceSlug]) + count(*[_type == "curlCommand" && spaceSlug == $spaceSlug])
    }
  }
`

export type DashboardData = {
  apiKeyGroups: (Pick<ApiKeyGroup, '_id' | 'storeName'> & { topKey?: ApiKeyGroup['keys'][number] })[]
  envGroups: (Pick<EnvGroupDoc, '_id' | 'projectName'> & { topVar?: EnvGroupDoc['vars'][number] })[]
  gqlQueries: GqlQueryDoc[]
  pins: PinDoc[]
  deployNotes: (Pick<DeployNoteDoc, '_id' | 'projectName'> & { topArea?: DeployNoteDoc['techAreas'][number] })[]
  webhooks: Pick<WebhookDoc, '_id' | 'name' | 'projectName' | 'url' | 'payload' | 'isFavorite' | 'lastUsed'>[]
  payloads: {
    json: Pick<JsonPayloadDoc, '_id' | 'name' | 'projectName' | 'payload' | 'isFavorite' | 'lastUsed'>[]
    curl: Pick<CurlCommandDoc, '_id' | 'label' | 'command' | 'category' | 'isFavorite' | 'lastUsed'>[]
  }
  counts: {
    apiKeys: number
    envVars: number
    graphql: number
    pins: number
    deployNotes: number
    webhooks: number
    payloads: number
  }
}

export async function getDashboardData(spaceSlug: string): Promise<DashboardData> {
  return client.fetch<DashboardData>(dashboardQuery, { spaceSlug })
}
