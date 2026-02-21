// Space slug = access credential. No slug = no data.
// Encryption implemented in S4. These are typed placeholders.

export async function deriveKey(_spaceSlug: string): Promise<CryptoKey> {
  throw new Error('crypto.ts: deriveKey not yet implemented (S4)')
}

export async function encrypt(_plain: string, _key: CryptoKey): Promise<string> {
  throw new Error('crypto.ts: encrypt not yet implemented (S4)')
}

export async function decrypt(_encrypted: string, _key: CryptoKey): Promise<string> {
  throw new Error('crypto.ts: decrypt not yet implemented (S4)')
}
