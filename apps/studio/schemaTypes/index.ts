import { type SchemaTypeDefinition } from "sanity";
import { space } from "./space";
import { user } from "./user";
import { apiKeyGroup } from "./apiKeyGroup";
import { envGroup } from "./envGroup";
import { gqlQuery } from "./gqlQuery";
import { pin } from "./pin";
import { deployNote } from "./deployNote";
import { webhook } from "./webhook";
import { jsonPayload } from "./jsonPayload";
import { curlCommand } from "./curlCommand";
import { shareLink } from "./shareLink";

export const schemaTypes: SchemaTypeDefinition[] = [
  space,
  user,
  apiKeyGroup,
  envGroup,
  gqlQuery,
  pin,
  deployNote,
  webhook,
  jsonPayload,
  curlCommand,
  shareLink,
];
