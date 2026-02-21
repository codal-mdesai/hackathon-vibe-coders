const SENSITIVE_PATTERNS = [
  'token',
  'key',
  'secret',
  'auth',
  'authorization',
  'x-api',
  'password',
  'passwd',
  'bearer',
]

export function isSensitiveKey(k: string): boolean {
  const lower = k.toLowerCase()
  return SENSITIVE_PATTERNS.some((pattern) => lower.includes(pattern))
}

export function maskValue(v: string): string {
  return '••••••' + v.slice(-4)
}
