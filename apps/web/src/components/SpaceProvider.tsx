"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  use,
} from "react";
import { createSpace, updateSpaceName, updateSpaceAccent } from "@/actions/space";

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
  setCounts: (counts: SpaceCounts) => void;
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem(`devpanel_name_${slug}`);
    if (storedName) setDisplayName(storedName);

    const storedAccent = localStorage.getItem(`devpanel_accent_${slug}`);
    if (storedAccent) {
      setAccentColor(storedAccent);
      document.documentElement.style.setProperty("--accent", storedAccent);
    }

    createSpace(slug, storedName ?? "My Space", storedAccent ?? "#3b82f6")
      .then(() => setInitialized(true))
      .catch(() => setInitialized(true));
  }, [slug]);

  const updateName = useCallback(
    (name: string) => {
      setDisplayName(name);
      localStorage.setItem(`devpanel_name_${slug}`, name);
      updateSpaceName(slug, name).catch(() => {});
    },
    [slug],
  );

  const updateAccent = useCallback(
    (color: string) => {
      setAccentColor(color);
      localStorage.setItem(`devpanel_accent_${slug}`, color);
      document.documentElement.style.setProperty("--accent", color);
      updateSpaceAccent(slug, color).catch(() => {});
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
        setCounts,
      }}
    >
      {initialized ? children : (
        <div className="flex h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        </div>
      )}
    </SpaceContext.Provider>
  );
}
