import { client } from "@/sanity/lib/client";
import type { ShareLink } from "@/types/sanity";

export async function fetchShareLink(token: string): Promise<ShareLink | null> {
  return client.fetch<ShareLink | null>(
    `*[_type == "shareLink" && token == $token][0]{
      _id, token, resourceType, resourceId, expiresAt, createdBy
    }`,
    { token } as Record<string, unknown>,
  );
}
