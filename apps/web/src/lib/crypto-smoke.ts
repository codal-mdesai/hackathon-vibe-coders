import { deriveKey, encrypt, decrypt } from "./crypto";

export async function smokeTest(): Promise<boolean> {
  const testSlug = "smoke-test-devpanel";
  const testPlaintext = "smoke-test-devpanel";

  const key = await deriveKey(testSlug);
  const encrypted = await encrypt(testPlaintext, key);
  const decrypted = await decrypt(encrypted, key);

  return decrypted === testPlaintext;
}
