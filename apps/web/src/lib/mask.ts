const SENSITIVE_PATTERNS = [
  "token",
  "key",
  "secret",
  "auth",
  "authorization",
  "x-api",
  "password",
  "passwd",
  "bearer",
] as const;

export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_PATTERNS.some((p) => lower.includes(p));
}

export function maskValue(value: string): string {
  if (value.length <= 4) return "••••••";
  return "••••••" + value.slice(-4);
}
