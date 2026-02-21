import { GraphQLSection } from '@/components/sections/GraphQLSection'

export default async function GraphQLPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <GraphQLSection spaceSlug={slug} />
}
