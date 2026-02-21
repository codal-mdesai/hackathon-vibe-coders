export function generateShareToken(): string {
  return crypto.randomUUID()
}

export function formatShareUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/share/${token}`
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}
