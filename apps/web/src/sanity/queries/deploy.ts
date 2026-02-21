import { client } from "@/sanity/lib/client";
import type { DeployNote } from "@/types/sanity";

export async function fetchDeployNotes(spaceSlug: string): Promise<DeployNote[]> {
  return client.fetch<DeployNote[]>(
    `*[_type == "deployNote" && spaceSlug == $spaceSlug] | order(projectName asc){
      _id, spaceSlug, projectName,
      techAreas[]{id, name, isFavorite, notes, commands[]{step, command, description}}
    }`,
    { spaceSlug } as Record<string, unknown>,
  );
}
