import { client } from "@/sanity/lib/client";

const TOP3 = `[0...3]`;

export async function fetchDashboardData(spaceSlug: string) {
  const params = { spaceSlug } as Record<string, unknown>;
  const [apiKeys, envVars, graphql, pins, deployNotes, webhooks, jsonPayloads, curlCommands] =
    await Promise.all([
      client.fetch(
        `*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug]{storeName, "items": keys[]{id, label, encryptedValue, isFavorite, usageCount} | order(usageCount desc) ${TOP3}}`,
        params,
      ),
      client.fetch(
        `*[_type == "envGroup" && spaceSlug == $spaceSlug]{projectName, "items": vars[]{id, key, encryptedValue, isFavorite, lastUsed} | order(lastUsed desc) ${TOP3}}`,
        params,
      ),
      client.fetch(
        `*[_type == "gqlQuery" && spaceSlug == $spaceSlug] | order(usageCount desc) ${TOP3}{_id, name, projectName, query, isFavorite, usageCount}`,
        params,
      ),
      client.fetch(
        `*[_type == "pin" && spaceSlug == $spaceSlug] | order(createdAt desc) ${TOP3}{_id, title, url, tags, color}`,
        params,
      ),
      client.fetch(
        `*[_type == "deployNote" && spaceSlug == $spaceSlug]{_id, projectName, "areas": techAreas[]{id, name, isFavorite} | order(isFavorite desc) ${TOP3}}`,
        params,
      ),
      client.fetch(
        `*[_type == "webhook" && spaceSlug == $spaceSlug] | order(lastUsed desc) ${TOP3}{_id, name, url, isFavorite}`,
        params,
      ),
      client.fetch(
        `*[_type == "jsonPayload" && spaceSlug == $spaceSlug] | order(lastUsed desc) ${TOP3}{_id, name, projectName, isFavorite}`,
        params,
      ),
      client.fetch(
        `*[_type == "curlCommand" && spaceSlug == $spaceSlug] | order(lastUsed desc) ${TOP3}{_id, label, category, isFavorite}`,
        params,
      ),
    ]);

  return { apiKeys, envVars, graphql, pins, deployNotes, webhooks, jsonPayloads, curlCommands };
}

export async function fetchDashboardCounts(spaceSlug: string) {
  const params = { spaceSlug } as Record<string, unknown>;
  const [apiKeys, envVars, graphql, pins, deployNotes, webhooks, jsonPayloads, curlCommands] =
    await Promise.all([
      client.fetch<number>(`count(*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug].keys[])`, params),
      client.fetch<number>(`count(*[_type == "envGroup" && spaceSlug == $spaceSlug].vars[])`, params),
      client.fetch<number>(`count(*[_type == "gqlQuery" && spaceSlug == $spaceSlug])`, params),
      client.fetch<number>(`count(*[_type == "pin" && spaceSlug == $spaceSlug])`, params),
      client.fetch<number>(`count(*[_type == "deployNote" && spaceSlug == $spaceSlug])`, params),
      client.fetch<number>(`count(*[_type == "webhook" && spaceSlug == $spaceSlug])`, params),
      client.fetch<number>(`count(*[_type == "jsonPayload" && spaceSlug == $spaceSlug])`, params),
      client.fetch<number>(`count(*[_type == "curlCommand" && spaceSlug == $spaceSlug])`, params),
    ]);

  return {
    apiKeys,
    envVars,
    graphql,
    pins,
    deployNotes,
    webhooks,
    payloads: jsonPayloads + curlCommands,
  };
}
