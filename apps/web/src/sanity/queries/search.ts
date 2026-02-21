import { client } from "@/sanity/lib/client";

export interface SearchResult {
  _id: string;
  _type: string;
  label: string;
  sub: string;
  href: string;
}

export async function searchAll(
  spaceSlug: string,
  term: string,
): Promise<SearchResult[]> {
  if (!term.trim()) return [];

  const query = `{
    "apiKeys": *[_type == "apiKeyGroup" && spaceSlug == $spaceSlug && (storeName match $term || keys[].label match $term)]{
      _id, _type, storeName, "matches": keys[label match $term]{id, label}
    },
    "envVars": *[_type == "envGroup" && spaceSlug == $spaceSlug && (projectName match $term || vars[].key match $term)]{
      _id, _type, projectName, "matches": vars[key match $term]{id, key}
    },
    "graphql": *[_type == "gqlQuery" && spaceSlug == $spaceSlug && name match $term]{
      _id, _type, name, projectName
    },
    "pins": *[_type == "pin" && spaceSlug == $spaceSlug && (title match $term || url match $term)]{
      _id, _type, title, url
    },
    "deployNotes": *[_type == "deployNote" && spaceSlug == $spaceSlug && (projectName match $term || techAreas[].name match $term)]{
      _id, _type, projectName, "matches": techAreas[name match $term]{id, name}
    },
    "webhooks": *[_type == "webhook" && spaceSlug == $spaceSlug && (name match $term || url match $term)]{
      _id, _type, name, url
    },
    "jsonPayloads": *[_type == "jsonPayload" && spaceSlug == $spaceSlug && name match $term]{
      _id, _type, name, projectName
    },
    "curlCommands": *[_type == "curlCommand" && spaceSlug == $spaceSlug && (label match $term)]{
      _id, _type, label, category
    }
  }`;

  const wildTerm = `${term}*`;
  const data = await client.fetch<{
    apiKeys: Array<{ _id: string; _type: string; storeName: string; matches: Array<{ id: string; label: string }> }>;
    envVars: Array<{ _id: string; _type: string; projectName: string; matches: Array<{ id: string; key: string }> }>;
    graphql: Array<{ _id: string; _type: string; name: string; projectName: string }>;
    pins: Array<{ _id: string; _type: string; title: string; url: string }>;
    deployNotes: Array<{ _id: string; _type: string; projectName: string; matches: Array<{ id: string; name: string }> }>;
    webhooks: Array<{ _id: string; _type: string; name: string; url: string }>;
    jsonPayloads: Array<{ _id: string; _type: string; name: string; projectName: string }>;
    curlCommands: Array<{ _id: string; _type: string; label: string; category: string }>;
  }>(query, { spaceSlug, term: wildTerm } as Record<string, unknown>);

  const results: SearchResult[] = [];

  for (const group of data.apiKeys) {
    for (const m of group.matches) {
      results.push({ _id: group._id, _type: "apiKeyGroup", label: m.label, sub: group.storeName, href: "api-keys" });
    }
    if (group.matches.length === 0) {
      results.push({ _id: group._id, _type: "apiKeyGroup", label: group.storeName, sub: "Store", href: "api-keys" });
    }
  }
  for (const group of data.envVars) {
    for (const m of group.matches) {
      results.push({ _id: group._id, _type: "envGroup", label: m.key, sub: group.projectName, href: "env-vars" });
    }
    if (group.matches.length === 0) {
      results.push({ _id: group._id, _type: "envGroup", label: group.projectName, sub: "Project", href: "env-vars" });
    }
  }
  for (const q of data.graphql) {
    results.push({ _id: q._id, _type: "gqlQuery", label: q.name, sub: q.projectName, href: "graphql" });
  }
  for (const p of data.pins) {
    results.push({ _id: p._id, _type: "pin", label: p.title, sub: p.url, href: "pinboard" });
  }
  for (const n of data.deployNotes) {
    for (const m of n.matches) {
      results.push({ _id: n._id, _type: "deployNote", label: m.name, sub: n.projectName, href: "deploy-notes" });
    }
    if (n.matches.length === 0) {
      results.push({ _id: n._id, _type: "deployNote", label: n.projectName, sub: "Project", href: "deploy-notes" });
    }
  }
  for (const w of data.webhooks) {
    results.push({ _id: w._id, _type: "webhook", label: w.name, sub: w.url, href: "webhooks" });
  }
  for (const j of data.jsonPayloads) {
    results.push({ _id: j._id, _type: "jsonPayload", label: j.name, sub: j.projectName, href: "payloads" });
  }
  for (const c of data.curlCommands) {
    results.push({ _id: c._id, _type: "curlCommand", label: c.label, sub: c.category, href: "payloads" });
  }

  return results;
}
