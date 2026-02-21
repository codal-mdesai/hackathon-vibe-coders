import { client } from "@/sanity/lib/client";
import type { GqlQuery } from "@/types/sanity";

export async function fetchGraphqlQueries(spaceSlug: string): Promise<GqlQuery[]> {
  return client.fetch<GqlQuery[]>(
    `*[_type == "gqlQuery" && spaceSlug == $spaceSlug] | order(usageCount desc){
      _id, spaceSlug, projectName, name, query, variables,
      isFavorite, usageCount, lastUsed
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
