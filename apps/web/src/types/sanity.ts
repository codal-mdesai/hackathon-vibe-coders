// All Sanity-derived TypeScript types. Mirrors apps/studio/schemaTypes/*.ts

export type SpaceDoc = {
  _id: string
  _type: 'space'
  slug: string
  displayName: string
  accentColor: string
  createdAt: string
  ownerId?: string
}

export type UserDoc = {
  _id: string
  _type: 'user'
  email: string
  name?: string
  spaces: string[]
  createdAt: string
}

export type ApiKeyEntry = {
  _key: string
  id: string
  label: string
  encryptedValue: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}

export type ApiKeyGroup = {
  _id: string
  _type: 'apiKeyGroup'
  spaceSlug: string
  storeName: string
  keys: ApiKeyEntry[]
}

export type EnvVarEntry = {
  _key: string
  id: string
  key: string
  encryptedValue: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}

export type EnvGroupDoc = {
  _id: string
  _type: 'envGroup'
  spaceSlug: string
  projectName: string
  vars: EnvVarEntry[]
}

export type GqlQueryDoc = {
  _id: string
  _type: 'gqlQuery'
  spaceSlug: string
  projectName: string
  name: string
  query: string
  variables?: string
  isFavorite: boolean
  usageCount: number
  lastUsed?: string
}

export type PinDoc = {
  _id: string
  _type: 'pin'
  spaceSlug: string
  url: string
  title: string
  tags: string[]
  addedBy?: string
  color: string
  gridX?: number
  gridY?: number
  deletedAt?: string
  createdAt: string
}

export type DeployCommand = {
  _key: string
  step: number
  command: string
  description?: string
}

export type TechArea = {
  _key: string
  id: string
  name: string
  isFavorite: boolean
  notes?: string
  lastUsed?: string
  commands: DeployCommand[]
}

export type DeployNoteDoc = {
  _id: string
  _type: 'deployNote'
  spaceSlug: string
  projectName: string
  techAreas: TechArea[]
}

export type WebhookHeader = {
  _key: string
  key: string
  value: string
}

export type WebhookComment = {
  _key: string
  field: string
  comment: string
}

export type WebhookDoc = {
  _id: string
  _type: 'webhook'
  spaceSlug: string
  projectName: string
  name: string
  url: string
  headers: WebhookHeader[]
  payload?: string
  comments: WebhookComment[]
  isFavorite: boolean
  lastUsed?: string
}

export type JsonPayloadDoc = {
  _id: string
  _type: 'jsonPayload'
  spaceSlug: string
  projectName: string
  name: string
  payload: string
  isFavorite: boolean
  lastUsed?: string
}

export type CurlCommandDoc = {
  _id: string
  _type: 'curlCommand'
  spaceSlug: string
  label: string
  command: string
  category: string
  isFavorite: boolean
  lastUsed?: string
}

export type ShareLinkDoc = {
  _id: string
  _type: 'shareLink'
  token: string
  resourceType: string
  resourceId: string
  expiresAt: string
  createdBy?: string
}
