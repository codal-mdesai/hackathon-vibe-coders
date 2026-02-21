import { client } from "@/sanity/lib/client";
import type { WebhookDoc } from "@/types/sanity";

export async function fetchWebhooks(spaceSlug: string): Promise<WebhookDoc[]> {
  return client.fetch<WebhookDoc[]>(
    `*[_type == "webhook" && spaceSlug == $spaceSlug] | order(lastUsed desc){
      _id, spaceSlug, projectName, name, url,
      headers[]{key, value}, payload,
      comments[]{field, comment},
      isFavorite, lastUsed
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
