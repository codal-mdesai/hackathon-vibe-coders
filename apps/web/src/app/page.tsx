"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const slug = localStorage.getItem("devpanel_space");
    if (slug) {
      router.replace(`/space/${slug}`);
    } else {
      const newSlug = nanoid(10);
      localStorage.setItem("devpanel_space", newSlug);
      router.replace(`/space/${newSlug}`);
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
    </div>
  );
}
