"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  use,
} from "react";

interface SpaceCounts {
  apiKeys: number;
  envVars: number;
  graphql: number;
  pins: number;
  deployNotes: number;
  webhooks: number;
  payloads: number;
  [key: string]: number;
}

interface SpaceContextValue {
  slug: string;
  displayName: string;
  accentColor: string;
  counts: SpaceCounts;
  updateName: (name: string) => void;
  updateAccent: (color: string) => void;
  refreshCounts: () => void;
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error("useSpace must be used within SpaceProvider");
  return ctx;
}

const DEFAULT_COUNTS: SpaceCounts = {
  apiKeys: 0,
  envVars: 0,
  graphql: 0,
  pins: 0,
  deployNotes: 0,
  webhooks: 0,
  payloads: 0,
};

export function SpaceProvider({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [displayName, setDisplayName] = useState("My Space");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [counts, setCounts] = useState<SpaceCounts>(DEFAULT_COUNTS);

  useEffect(() => {
    const storedName = localStorage.getItem(`devpanel_name_${slug}`);
    if (storedName) setDisplayName(storedName);

    const storedAccent = localStorage.getItem(`devpanel_accent_${slug}`);
    if (storedAccent) {
      setAccentColor(storedAccent);
      document.documentElement.style.setProperty("--accent", storedAccent);
    }
  }, [slug]);

  const updateName = useCallback(
    (name: string) => {
      setDisplayName(name);
      localStorage.setItem(`devpanel_name_${slug}`, name);
    },
    [slug],
  );

  const updateAccent = useCallback(
    (color: string) => {
      setAccentColor(color);
      localStorage.setItem(`devpanel_accent_${slug}`, color);
      document.documentElement.style.setProperty("--accent", color);
    },
    [slug],
  );

  const refreshCounts = useCallback(() => {
    setCounts((prev) => ({ ...prev }));
  }, []);

  return (
    <SpaceContext.Provider
      value={{
        slug,
        displayName,
        accentColor,
        counts,
        updateName,
        updateAccent,
        refreshCounts,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}
