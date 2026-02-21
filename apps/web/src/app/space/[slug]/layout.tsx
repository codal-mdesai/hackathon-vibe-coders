import { Sidebar } from '@/components/Sidebar'
import { CmdK } from '@/components/CmdK'
import { SpaceProvider } from '@/providers/SpaceProvider'
import { getSpaceBySlug } from '@/actions/space'

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Load space data server-side for initial render
  let initialDisplayName: string | undefined
  let initialAccentColor: string | undefined
  try {
    const space = await getSpaceBySlug(slug)
    initialDisplayName = space?.displayName
    initialAccentColor = space?.accentColor
  } catch {
    // Sanity not configured yet — proceed with defaults
  }

  return (
    <SpaceProvider
      slug={slug}
      initialDisplayName={initialDisplayName}
      initialAccentColor={initialAccentColor}
    >
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <CmdK />
    </SpaceProvider>
  )
}
