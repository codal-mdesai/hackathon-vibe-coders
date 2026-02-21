import { DeployNotesSection } from '@/components/sections/DeployNotesSection'

export default async function DeployNotesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <DeployNotesSection spaceSlug={slug} />
}
