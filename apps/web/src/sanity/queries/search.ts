import { client } from '@/sanity/lib/client'

export type SearchResult = {
  _id: string
  _type: string
  title: string
  subtitle: string
  section: string
  href: string
}

type RawResult = {
  _id: string
  _type: string
  // api key group
  storeName?: string
  // env group
  projectName?: string
  // gql
  name?: string
  query?: string
  // pin
  title?: string
  url?: string
  // deploy note
  // webhook
  // json payload / curl
  label?: string
  command?: string
  category?: string
  payload?: string
}

function toSearchResult(raw: RawResult, spaceSlug: string): SearchResult | null {
  switch (raw._type) {
    case 'apiKeyGroup':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.storeName ?? '',
        subtitle: 'API Key Group',
        section: 'API Keys',
        href: `/space/${spaceSlug}/api-keys`,
      }
    case 'envGroup':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.projectName ?? '',
        subtitle: 'Env Vars Group',
        section: 'Env Vars',
        href: `/space/${spaceSlug}/env-vars`,
      }
    case 'gqlQuery':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.name ?? '',
        subtitle: raw.projectName ?? '',
        section: 'GraphQL',
        href: `/space/${spaceSlug}/graphql`,
      }
    case 'pin':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.title ?? '',
        subtitle: raw.url ?? '',
        section: 'Pinboard',
        href: `/space/${spaceSlug}/pinboard`,
      }
    case 'deployNote':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.projectName ?? '',
        subtitle: 'Deploy Notes',
        section: 'Deploy Notes',
        href: `/space/${spaceSlug}/deploy-notes`,
      }
    case 'webhook':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.name ?? '',
        subtitle: raw.projectName ?? '',
        section: 'Webhooks',
        href: `/space/${spaceSlug}/webhooks`,
      }
    case 'jsonPayload':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.name ?? '',
        subtitle: raw.projectName ?? '',
        section: 'JSON & CURL',
        href: `/space/${spaceSlug}/payloads`,
      }
    case 'curlCommand':
      return {
        _id: raw._id,
        _type: raw._type,
        title: raw.label ?? '',
        subtitle: raw.category ?? '',
        section: 'JSON & CURL',
        href: `/space/${spaceSlug}/payloads`,
      }
    default:
      return null
  }
}

export async function globalSearch(
  spaceSlug: string,
  phrase: string,
): Promise<SearchResult[]> {
  if (!phrase.trim()) return []

  // GROQ match() for full-text phrase search across all section types
  const query = `*[
    spaceSlug == $spaceSlug
    && (
      _type == "apiKeyGroup"    && storeName    match $phrase
      || _type == "envGroup"   && projectName  match $phrase
      || _type == "gqlQuery"   && (name match $phrase || query match $phrase)
      || _type == "pin"        && (title match $phrase || url match $phrase)
      || _type == "deployNote" && projectName  match $phrase
      || _type == "webhook"    && (name match $phrase || url match $phrase)
      || _type == "jsonPayload"&& (name match $phrase || payload match $phrase)
      || _type == "curlCommand"&& (label match $phrase || command match $phrase)
    )
  ] {
    _id,
    _type,
    storeName,
    projectName,
    name,
    query,
    title,
    url,
    label,
    command,
    category,
    payload
  }[0..19]`

  const params: Record<string, string> = { spaceSlug, phrase: `*${phrase}*` }
  const raw = await client.fetch<RawResult[]>(query, params)
  return raw.flatMap((r) => {
    const result = toSearchResult(r, spaceSlug)
    return result ? [result] : []
  })
}
