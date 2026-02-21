import { client } from "@/sanity/lib/client";
import type { JsonPayload, CurlCommand } from "@/types/sanity";

export async function fetchJsonPayloads(spaceSlug: string): Promise<JsonPayload[]> {
  return client.fetch<JsonPayload[]>(
    `*[_type == "jsonPayload" && spaceSlug == $spaceSlug] | order(lastUsed desc){
      _id, spaceSlug, projectName, name, payload, isFavorite, lastUsed
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}

export async function fetchCurlCommands(spaceSlug: string): Promise<CurlCommand[]> {
  return client.fetch<CurlCommand[]>(
    `*[_type == "curlCommand" && spaceSlug == $spaceSlug] | order(lastUsed desc){
      _id, spaceSlug, label, command, category, isFavorite, lastUsed
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
