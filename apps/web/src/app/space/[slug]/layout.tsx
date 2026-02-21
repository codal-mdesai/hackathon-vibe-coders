"use client";

import { Sidebar } from "@/components/Sidebar";
import { SpaceProvider, useSpace } from "@/components/SpaceProvider";
import { CommandMenu } from "@/components/CommandMenu";

function SpaceLayoutInner({ children }: { children: React.ReactNode }) {
  const { displayName, counts, updateName } = useSpace();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar counts={counts} spaceName={displayName} onNameChange={updateName} />
      <main className="flex-1 overflow-hidden">{children}</main>
      <CommandMenu />
    </div>
  );
}

export default function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <SpaceProvider params={params}>
      <SpaceLayoutInner>{children}</SpaceLayoutInner>
    </SpaceProvider>
  );
}
