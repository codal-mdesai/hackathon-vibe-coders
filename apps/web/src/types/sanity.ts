export interface Space {
  _id: string;
  _type: "space";
  slug: string;
  displayName: string;
  accentColor: string;
  createdAt: string;
  ownerId?: string;
}

export interface User {
  _id: string;
  _type: "user";
  email: string;
  name: string;
  spaces: string[];
  createdAt: string;
}

export interface ApiKey {
  id: string;
  label: string;
  encryptedValue: string;
  isFavorite: boolean;
  usageCount: number;
  lastUsed: string;
}

export interface ApiKeyGroup {
  _id: string;
  _type: "apiKeyGroup";
  spaceSlug: string;
  storeName: string;
  keys: ApiKey[];
}

export interface EnvVar {
  id: string;
  key: string;
  encryptedValue: string;
  isFavorite: boolean;
  usageCount: number;
  lastUsed: string;
}

export interface EnvGroup {
  _id: string;
  _type: "envGroup";
  spaceSlug: string;
  projectName: string;
  vars: EnvVar[];
}

export interface GqlQuery {
  _id: string;
  _type: "gqlQuery";
  spaceSlug: string;
  projectName: string;
  name: string;
  query: string;
  variables: string;
  isFavorite: boolean;
  usageCount: number;
  lastUsed: string;
}

export interface PinItem {
  _id: string;
  _type: "pin";
  spaceSlug: string;
  url: string;
  title: string;
  tags: string[];
  addedBy: string;
  color: string;
  createdAt: string;
}

export interface DeployCommand {
  step: number;
  command: string;
  description: string;
}

export interface TechArea {
  id: string;
  name: string;
  isFavorite: boolean;
  notes: string;
  commands: DeployCommand[];
}

export interface DeployNote {
  _id: string;
  _type: "deployNote";
  spaceSlug: string;
  projectName: string;
  techAreas: TechArea[];
}

export interface WebhookHeader {
  key: string;
  value: string;
}

export interface WebhookComment {
  field: string;
  comment: string;
}

export interface WebhookDoc {
  _id: string;
  _type: "webhook";
  spaceSlug: string;
  projectName: string;
  name: string;
  url: string;
  headers: WebhookHeader[];
  payload: string;
  comments: WebhookComment[];
  isFavorite: boolean;
  lastUsed: string;
}

export interface JsonPayload {
  _id: string;
  _type: "jsonPayload";
  spaceSlug: string;
  projectName: string;
  name: string;
  payload: string;
  isFavorite: boolean;
  lastUsed: string;
}

export interface CurlCommand {
  _id: string;
  _type: "curlCommand";
  spaceSlug: string;
  label: string;
  command: string;
  category: string;
  isFavorite: boolean;
  lastUsed: string;
}

export interface ShareLink {
  _id: string;
  _type: "shareLink";
  token: string;
  resourceType: string;
  resourceId: string;
  expiresAt: string;
  createdBy?: string;
}
