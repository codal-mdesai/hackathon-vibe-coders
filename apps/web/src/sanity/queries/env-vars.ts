import { client } from "@/sanity/lib/client";
import type { EnvGroup } from "@/types/sanity";

export async function fetchEnvVars(spaceSlug: string): Promise<EnvGroup[]> {
  return client.fetch<EnvGroup[]>(
    `*[_type == "envGroup" && spaceSlug == $spaceSlug] | order(projectName asc){
      _id, spaceSlug, projectName,
      vars[]{id, key, encryptedValue, isFavorite, usageCount, lastUsed}
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
