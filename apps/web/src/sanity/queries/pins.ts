import { client } from "@/sanity/lib/client";
import type { PinItem } from "@/types/sanity";

export async function fetchPins(spaceSlug: string): Promise<PinItem[]> {
  return client.fetch<PinItem[]>(
    `*[_type == "pin" && spaceSlug == $spaceSlug] | order(createdAt desc){
      _id, spaceSlug, url, title, tags, addedBy, color, createdAt
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
