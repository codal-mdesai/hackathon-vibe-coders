"use server";

import { client } from "@/sanity/lib/client";

export async function generateShareLink(
  resourceType: string,
  resourceId: string,
  hours: number = 24,
): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  await client.withConfig({ token: process.env.SANITY_API_WRITE_TOKEN }).create({
    _type: "shareLink",
    token,
    resourceType,
    resourceId,
    expiresAt,
  });

  return token;
}

export async function validateShareLink(
  token: string,
): Promise<{ valid: boolean; resourceType?: string; resourceId?: string; expiresAt?: string }> {
  const query = `*[_type == "shareLink" && token == $token][0]{resourceType, resourceId, expiresAt}`;
  const result = await client.fetch<{
    resourceType: string;
    resourceId: string;
    expiresAt: string;
  } | null>(query, { token } as Record<string, unknown>);

  if (!result) return { valid: false };

  const expired = new Date(result.expiresAt) < new Date();
  if (expired) return { valid: false, expiresAt: result.expiresAt };

  return {
    valid: true,
    resourceType: result.resourceType,
    resourceId: result.resourceId,
    expiresAt: result.expiresAt,
  };
}
