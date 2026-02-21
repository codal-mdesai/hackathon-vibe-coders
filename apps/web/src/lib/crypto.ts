// Space slug = access credential. No slug = no data.
// PBKDF2-derived key scoped to each space. AES-256-GCM for all values.
// Never expose ENCRYPTION_SALT client-side.

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 256

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}

function uint8ToBase64(buf: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!)
  return btoa(bin)
}

// Derives an AES-256-GCM key from spaceSlug + ENCRYPTION_SALT via PBKDF2.
// On the client, ENCRYPTION_SALT comes from a special endpoint or is embedded
// during SSR. On the server, it comes directly from process.env.
//
// For DevPanel, we embed the salt at build time in the page that calls deriveKey
// so it is never stored in localStorage or cookies.
async function getSalt(): Promise<string> {
  if (typeof process !== 'undefined' && process.env.ENCRYPTION_SALT) {
    return process.env.ENCRYPTION_SALT
  }
  // Client-side fallback: use a known constant for the hackathon.
  // Production deployments must set ENCRYPTION_SALT via server-side embedding.
  return 'devpanel-default-salt-change-in-production'
}

export async function deriveKey(spaceSlug: string): Promise<CryptoKey> {
  const salt = await getSalt()
  const enc = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(spaceSlug + salt),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(plain: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain))

  // Format: base64(iv) + ':' + base64(ciphertext)
  return uint8ToBase64(iv) + ':' + uint8ToBase64(new Uint8Array(ciphertext))
}

export async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
  const [ivB64, ctB64] = encrypted.split(':')
  if (!ivB64 || !ctB64) throw new Error('Invalid encrypted format')

  const ivBuf = base64ToArrayBuffer(ivB64)
  const ciphertext = base64ToArrayBuffer(ctB64)

  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, key, ciphertext)

  return new TextDecoder().decode(plain)
}
