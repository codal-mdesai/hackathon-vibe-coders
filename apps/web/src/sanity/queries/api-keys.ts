import { client } from "@/sanity/lib/client";
import type { ApiKeyGroup } from "@/types/sanity";

export async function fetchApiKeys(spaceSlug: string): Promise<ApiKeyGroup[]> {
  return client.fetch<ApiKeyGroup[]>(
    `*[_type == "apiKeyGroup" && spaceSlug == $spaceSlug] | order(storeName asc){
      _id, spaceSlug, storeName,
      keys[]{id, label, encryptedValue, isFavorite, usageCount, lastUsed}
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
