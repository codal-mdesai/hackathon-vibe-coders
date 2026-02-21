import { Sidebar } from '@/components/Sidebar'
import { CmdK } from '@/components/CmdK'
import { SpaceProvider } from '@/providers/SpaceProvider'

export default async function SpaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <SpaceProvider slug={slug}>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <CmdK />
    </SpaceProvider>
  )
}
