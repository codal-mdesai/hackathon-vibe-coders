export function toCurl(query: string, variables: string): string {
  const body = JSON.stringify({ query, variables: variables ? JSON.parse(variables) : {} });
  return `curl -X POST {endpoint} -H 'Content-Type: application/json' -d '${body}'`;
}

export function toFetch(query: string, variables: string): string {
  const vars = variables || "{}";
  return `fetch('{endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: \`${query}\`, variables: ${vars} })
})`;
}

export function toAxios(query: string, variables: string): string {
  const vars = variables || "{}";
  return `axios.post('{endpoint}', {
  query: \`${query}\`,
  variables: ${vars}
})`;
}

export function toNodeFetch(query: string, variables: string): string {
  const vars = variables || "{}";
  return `import fetch from 'node-fetch';

fetch('{endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: \`${query}\`, variables: ${vars} })
}).then(res => res.json())`;
}
