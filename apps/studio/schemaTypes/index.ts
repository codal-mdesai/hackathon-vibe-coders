import { type SchemaTypeDefinition } from 'sanity'
import { spaceSchema } from './space'
import { userSchema } from './user'
import { apiKeyGroupSchema } from './apiKeyGroup'
import { envGroupSchema } from './envGroup'
import { gqlQuerySchema } from './gqlQuery'
import { pinSchema } from './pin'
import { deployNoteSchema } from './deployNote'
import { webhookSchema } from './webhook'
import { jsonPayloadSchema } from './jsonPayload'
import { curlCommandSchema } from './curlCommand'
import { shareLinkSchema } from './shareLink'

export const schemaTypes: SchemaTypeDefinition[] = [
  spaceSchema,
  userSchema,
  apiKeyGroupSchema,
  envGroupSchema,
  gqlQuerySchema,
  pinSchema,
  deployNoteSchema,
  webhookSchema,
  jsonPayloadSchema,
  curlCommandSchema,
  shareLinkSchema,
]
