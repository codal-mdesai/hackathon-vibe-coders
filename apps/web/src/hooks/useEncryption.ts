"use client";

import { useCallback, useRef } from "react";
import { deriveKey, encrypt, decrypt } from "@/lib/crypto";
import { useSpace } from "@/components/SpaceProvider";

export function useEncryption() {
  const { slug } = useSpace();
  const keyCache = useRef<CryptoKey | null>(null);

  const getKey = useCallback(async () => {
    if (!keyCache.current) {
      keyCache.current = await deriveKey(slug);
    }
    return keyCache.current;
  }, [slug]);

  const encryptValue = useCallback(
    async (plain: string) => {
      const key = await getKey();
      return encrypt(plain, key);
    },
    [getKey],
  );

  const decryptValue = useCallback(
    async (encrypted: string) => {
      const key = await getKey();
      return decrypt(encrypted, key);
    },
    [getKey],
  );

  return { encryptValue, decryptValue } as const;
}
